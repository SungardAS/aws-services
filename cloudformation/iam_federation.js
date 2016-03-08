
var AWS = require('aws-sdk');

function IAMFederation() {

  var me = this;

  me.deploy = function(input, callback) {
    getRole(input, function(err, data) {
      if(err) callback(err, null);
      else {
        addStatement(input, callback);
      }
    });
  }

  me.clean = function(input, callback) {
    getRole(input, function(err, data) {
      if(err) callback(err, null);
      else {
        removeStatement(input, callback);
      }
    });
  }

  me.build = function(action, packageJSON, callback) {
    var input = {
      region: packageJSON.Region,
      roleArn: packageJSON.RoleArn,
      federationRoleName: packageJSON.FederationRoleName
    };
    console.log(input);
    me[action](input, callback);
  }
}

function findService(input) {
  var params = {region: input.region};
  if (input.creds)  params.credentials = input.creds;
  var iam = new AWS.IAM(params);
  return iam;
}

function getRole(input, callback) {
  var iam = findService(input);
  var params = {
    RoleName: input.federationRoleName
  };
  console.log('findRole : ' + JSON.stringify(params));
  iam.getRole(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    }
    else {
      //console.log(data);
      input.assumeDoc = JSON.parse(unescape(data.Role.AssumeRolePolicyDocument));
      callback(null, input);
    }
  });
}

function addStatement(input, callback) {
  var assumeDoc = input.assumeDoc;
  var federationRoleName = input.federationRoleName;
  var lambdaRoleArn = input.roleArn;
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
    updateAssumeRolePolicy(input, callback);
  }
  else {
    console.log("policy was already added to 'federate' role  for '" + lambdaRoleArn + "'");
    callback(null, true);
  }
}

function removeStatement(input, callback) {
  var assumeDoc = input.assumeDoc;
  var federationRoleName = input.federationRoleName;
  var lambdaRoleArn = input.roleArn;
  console.log(assumeDoc.Statement);
  console.log(input.roleArn);
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
    updateAssumeRolePolicy(input, callback);
  }
  else {
    console.log("policy was already removed from 'federate' role for '" + lambdaRoleArn + "'");
    callback(null, true);
  }
}

function updateAssumeRolePolicy(input, callback) {
  var iam = findService(input);
  var params = {
    PolicyDocument: JSON.stringify(input.assumeDoc),
    RoleName: input.federationRoleName
  };
  console.log('updateAssumeRolePolicy : ' + JSON.stringify(params));
  iam.updateAssumeRolePolicy(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    }
    else {
      console.log(data);
      callback(null, true);
    }
  });
}

module.exports = IAMFederation
