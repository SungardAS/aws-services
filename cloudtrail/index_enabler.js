
exports.handler = function (event, context) {

  var AWSS3Bucket = require('../lib/s3bucket.js');
  var aws_bucket = new AWSS3Bucket();
  var AWSCloudTrail = require('../lib/cloudtrail.js');
  var aws_trail = new AWSCloudTrail();

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var bucketName = event.account + data_json.bucketNamePostfix;
  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: event.region,
    trailName: data_json.trailName,
    bucketName: bucketName,
    policyName: 'bucket_cloudtrail_policy',
    resources: [
      'arn:aws:s3:::' + bucketName,
      'arn:aws:s3:::' + bucketName + '/AWSLogs/' + event.account + '/*']
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  var functionChain = [
    {func:aws_bucket.findBucket, success:aws_bucket.getPolicy, failure:aws_bucket.createBucket, error:context.fail},
    {func:aws_bucket.createBucket, success:aws_bucket.addPolicy, failure:failed, error:context.fail},
    {func:aws_bucket.getPolicy, success:aws_trail.findTrails, failure:aws_bucket.addPolicy, error:context.fail},
    {func:aws_bucket.addPolicy, success:aws_trail.findTrails, failure:failed, error:context.fail},
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:aws_trail.createTrail, error:context.fail},
    {func:aws_trail.createTrail, success:aws_trail.startLogging, failure:context.fail, error:context.fail},
    {func:aws_trail.isLogging, success:succeeded, failure:aws_trail.startLogging, error:context.fail},
    {func:aws_trail.startLogging, success:succeeded, failure:context.fail, error:context.fail},
  ]
  input.functionChain = functionChain;

  input.functionChain[0].func(input);
};
