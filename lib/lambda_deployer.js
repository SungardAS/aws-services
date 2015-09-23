
var zipper = new (require('./zipper/zipper'))();
var aws_bucket = new (require('./aws/s3bucket.js'))();
var aws_role = new(require('./aws/role.js'))();
var aws_lambda = new (require('./aws/lambda.js'))();
var aws_sts = new (require('./aws/sts'))();

function LambdaDeployer() {

  var me = this;

  function succeeded() {
    console.log("Successfully completed!!");
  }

  function findFederateAssumeRolePolicy(input, callback) {
    params = {
      creds: input.creds,
      roleName: input.federateRoleName
    };
    aws_role.findRole(params, function(err, data) {
      if (err)  console.log(err, err.stack);
      else {
        //console.log(data);
        var assumeDoc = JSON.parse(unescape(data.Role.AssumeRolePolicyDocument));
        callback(input, assumeDoc);
      }
    });
  }

  function addStatement(input, assumeDoc) {
    console.log(assumeDoc.Statement);
    console.log(input.lambdaRoleArn);
    var federateRoleName = input.federateRoleName;
    var lambdaRoleArn = input.lambdaRoleArn;
    var lambdaStatement = {
      Sid: '',
      Effect: 'Allow',
      Principal: { AWS: lambdaRoleArn },
      Action: 'sts:AssumeRole'
    };
    var statements = assumeDoc.Statement.filter(function(statement) {
      return statement.Principal.AWS == lambdaRoleArn;
    });
    console.log(statements.length);
    if (statements.length == 0) {
      assumeDoc.Statement.push(lambdaStatement);
      console.log(assumeDoc.Statement);
      updateAssumeDoc(input, assumeDoc, aws_bucket.findBucket);
    }
    else {
      console.log("policy was already added to 'federate' role  for '" + lambdaRoleArn + "'");
      aws_bucket.findBucket(input);
    }
  }

  function removeStatement(input, assumeDoc) {
    console.log(assumeDoc.Statement);
    console.log(input.lambdaRoleArn);
    var federateRoleName = input.federateRoleName;
    var lambdaRoleArn = input.lambdaRoleArn;
    var found = -1;
    for (var i = 0; i < assumeDoc.Statement.length; i++) {
      if (assumeDoc.Statement[i].Principal.AWS == lambdaRoleArn) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      assumeDoc.Statement.splice(found, 1);
      console.log(assumeDoc.Statement);
      updateAssumeDoc(input, assumeDoc, aws_lambda.findFunction);
    }
    else {
      console.log("policy was already removed from 'federate' role for '" + lambdaRoleArn + "'");
      aws_lambda.findFunction(input);
    }
  }

  function updateAssumeDoc(input, assumeDoc, callback) {
    var params = {
      creds: input.creds,
      policyDocument: JSON.stringify(assumeDoc),
      roleName: input.federateRoleName
    };
    aws_role.updateAssumeRolePolicy(params, function(err, data) {
      if (err) console.log(err, err.stack);
      else {
        console.log(data);
        callback(input);
      }
    });
  }

  function addFederateAssumeRolePolicy(input) {
    if (input.federateRoleName) {
      findFederateAssumeRolePolicy(input, addStatement);
    }
    else {
      aws_bucket.findBucket(input);
    }
  }

  function removeFederateAssumeRolePolicy(input) {
    if (input.federateRoleName) {
      findFederateAssumeRolePolicy(input, removeStatement);
    }
    else {
      aws_lambda.findFunction(input);
    }
  }

  me.deploy = function(input, callback) {
    if(!callback) callback = succeeded;
    var flows = [
      {func:aws_sts.assumeRoles, success:aws_role.findRole},
      {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole},
      {func:aws_role.createRole, success:aws_role.findInlinePolicy},
      {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy},
      {func:aws_role.createInlinePolicy, success:aws_role.wait},
      //{func:aws_role.wait, success:aws_bucket.findBucket},
      {func:aws_role.wait, success:addFederateAssumeRolePolicy},
      {func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket},
      {func:aws_bucket.createBucket, success:zipper.zip},
      {func:zipper.zip, success:aws_bucket.putObject},
      {func:aws_bucket.putObject, success:aws_lambda.findFunction},
      {func:aws_lambda.findFunction, success:aws_lambda.updateFunctionCode, failure:aws_lambda.createFunction},
      {func:aws_lambda.updateFunctionCode, success:callback},
      {func:aws_lambda.createFunction, success:callback},
    ];
    aws_sts.flows = flows;
    aws_role.flows = flows;
    aws_bucket.flows = flows;
    zipper.flows = flows;
    aws_lambda.flows = flows;
    flows[0].func(input);
  }

  me.clean = function(input, callback) {
    if(!callback) callback = succeeded;
    var flows = [
      {func:aws_sts.assumeRoles, success:removeFederateAssumeRolePolicy},
      {func:aws_lambda.findFunction, success:aws_lambda.deleteFunction, failure:aws_role.findInlinePolicy},
      {func:aws_lambda.deleteFunction, success:aws_role.findInlinePolicy},
      {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
      {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
      {func:aws_role.findRole, success:aws_role.deleteRole, failure:callback},
      {func:aws_role.deleteRole, success:callback},
    ];
    aws_sts.flows = flows;
    aws_role.flows = flows;
    aws_lambda.flows = flows;
    flows[0].func(input);
  }
}

module.exports = LambdaDeployer
