
exports.handler = function (event, context) {

  var AWSCloudTrail = require('../lib/cloudtrail.js');
  var aws_trail = new AWSCloudTrail();

  var input = {
    profile: event.profile,
    region: event.region,
    trailName: event.trailName,
    bucketName: event.bucketName
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  var functionChain = [
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:aws_trail.createTrail, error:context.fail},
    {func:aws_trail.createTrail, success:aws_trail.startLogging, failure:context.fail, error:context.fail},
    {func:aws_trail.isLogging, success:succeeded, failure:aws_trail.startLogging, error:context.fail},
    {func:aws_trail.startLogging, success:succeeded, failure:context.fail, error:context.fail},
  ]
  input.functionChain = functionChain;

  aws_trail.findTrails(input);
};
