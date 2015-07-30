
exports.handler = function (event, context) {

  var AWSS3Bucket = require('../lib/s3bucket.js');
  var aws_bucket = new AWSS3Bucket();

  var input = {
    profile: event.profile,
    bucketName: event.bucketName,
  };

  var functionChain = [
    {func:aws_bucket.findBucket, success:succeeded, failure:aws_bucket.createBucket, error:context.fail},
    {func:aws_bucket.createBucket, success:succeeded, failure:failed, error:context.fail},
  ]
  input.functionChain = functionChain;

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  aws_bucket.findBucket(input);
};
