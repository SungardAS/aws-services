
function LambdaDeployer() {

  var AWSS3Bucket = require('./s3bucket.js');
  var aws_bucket = new AWSS3Bucket();
  var AWSRole = require('./role.js');
  var aws_role = new AWSRole();
  var AWSLambda = require('./lambda.js');
  var aws_lambda = new AWSLambda();

  var me = this;

  me.preconfig = function(input) {
    var functionChain = [
      {func:aws_bucket.findBucket, success:aws_bucket.putObject, failure:aws_bucket.createBucket, error:null},
      {func:aws_bucket.createBucket, success:aws_bucket.putObject, failure:null, error:null},
      {func:aws_bucket.putObject, success:aws_role.findRole, failure:null, error:null},
      {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole, error:null},
      {func:aws_role.createRole, success:aws_role.findInlinePolicy, failure:null, error:null},
      {func:aws_role.findInlinePolicy, success:null, failure:aws_role.createInlinePolicy, error:null},
      {func:aws_role.createInlinePolicy, success:null, failure:null, error:null},
    ]
    input.functionChain = functionChain;
    functionChain[0].func(input);
  }

  me.remove_pre = function(input) {
    var functionChain = [
      {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
      {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
      {func:aws_role.findRole, success:aws_role.deleteRole, failure:aws_bucket.findObject},
      {func:aws_role.deleteRole, success:aws_bucket.findObject},
      {func:aws_bucket.findObject, success:aws_bucket.deleteObject},
      {func:aws_bucket.deleteObject},
    ]
    input.functionChain = functionChain;
    functionChain[0].func(input);
  }

  me.deploy = function(input) {
    var functionChain = [
      {func:aws_bucket.findBucket, success:aws_bucket.findObject, failure:null, error:null},
      {func:aws_bucket.findObject, success:aws_role.findRole, failure:null, error:null},
      {func:aws_role.findRole, success:aws_lambda.findFunction, failure:null, error:null},
      {func:aws_lambda.findFunction, success:null, failure:aws_lambda.createFunction},
      {func:aws_lambda.createFunction},
    ]
    input.functionChain = functionChain;
    functionChain[0].func(input);
  }

  me.remove = function(input) {
    var functionChain = [
      {func:aws_lambda.findFunction, success:aws_lambda.deleteFunction, failure:null},
      {func:aws_lambda.deleteFunction},
    ]
    input.functionChain = functionChain;
    functionChain[0].func(input);
  }
}

module.exports = LambdaDeployer
