
exports.handler = function (event, context) {

  var AWSCloudTrail = require('../lib/cloudtrail.js');
  var aws_trail = new AWSCloudTrail();

  var input = {
    profile: event.profile,
    region: event.region,
    trailName: event.trailName
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  var functionChain = [
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:failed, error:context.fail},
    {func:aws_trail.isLogging, success:succeeded, failure:failed, error:context.fail},
  ]
  input.functionChain = functionChain;

  aws_trail.findTrails(input);
};
