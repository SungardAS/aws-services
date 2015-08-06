
function LambdaDeployer() {

  var aws_bucket = new(require('../lib/s3bucket.js'))();
  var aws_role = new(require('../lib/role.js'))();
  var aws_lambda = new(require('../lib/lambda.js'))();

  var me = this;

  function succeeded() {
    console.log("Successfully completed!!")
  }

  me.remove_role = function(input) {
    var flows = [
      {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
      {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
      {func:aws_role.findRole, success:aws_role.deleteRole},
      {func:aws_role.deleteRole},
    ]
    aws_role.flows = flows;
    flows[0].func(input);
  }

  me.deploy = function(input) {
    var flows = [
      {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole, error:null},
      {func:aws_role.createRole, success:aws_role.findInlinePolicy, failure:null, error:null},
      {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy, error:null},
      {func:aws_role.createInlinePolicy, success:aws_role.wait, failure:null, error:null},
      {func:aws_role.wait, success:aws_bucket.findBucket, failure:null, error:null},
      {func:aws_bucket.findBucket, success:aws_bucket.findObject, failure:null, error:null},
      {func:aws_bucket.findObject, success:aws_lambda.findFunction, failure:null, error:null},
      {func:aws_lambda.findFunction, success:succeeded, failure:aws_lambda.createFunction},
      {func:aws_lambda.createFunction, success:succeeded},
    ]
    aws_role.flows = flows;
    aws_bucket.flows = flows;
    aws_lambda.flows = flows;
    flows[0].func(input);
  }

  me.remove = function(input) {
    var flows = [
      {func:aws_lambda.findFunction, success:aws_lambda.deleteFunction, failure:null},
      {func:aws_lambda.deleteFunction},
    ]
    aws_lambda.flows = flows;
    flows[0].func(input);
  }
}

module.exports = LambdaDeployer
