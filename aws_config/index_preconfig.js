
exports.handler = function (event, context) {

  var AWSS3Bucket = require('../lib/s3bucket.js');
  var aws_bucket = new AWSS3Bucket();
  var AWSRole = require('../lib/role.js');
  var aws_role = new AWSRole();

  var input = {
    profile : event.profile,
    region: event.region,
    bucketName : event.bucketName,
    topicName : event.topicName,
    roleName : event.roleName,
    assumeRolePolicyName: event.assumeRolePolicyName,
    inlinePolicyName: event.inlinePolicyName,
    roleArn : null,
  };

  var functionChain = [
    {func:aws_bucket.findBucket, success:aws_role.findRole, failure:aws_bucket.createBucket, error:context.fail},
    {func:aws_bucket.createBucket, success:aws_role.findRole, failure:failed, error:context.fail},
    {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole, error:context.fail},
    {func:aws_role.createRole, success:aws_role.findInlinePolicy, failure:failed, error:context.fail},
    {func:aws_role.findInlinePolicy, success:succeeded, failure:aws_role.createInlinePolicy, error:context.fail},
    {func:aws_role.createInlinePolicy, success:succeeded, failure:failed, error:context.fail},
  ]
  input.functionChain = functionChain;

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  aws_bucket.findBucket(input);
};
