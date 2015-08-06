
exports.handler = function (event, context) {

  var aws_trail = new (require('../lib/cloudtrail.js'))();

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: event.region
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  var flows = [
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:failed, error:context.fail},
    {func:aws_trail.isLogging, success:succeeded, failure:failed, error:context.fail},
  ]
  aws_trail.flows = flows;

  flows[0].func(input);
};
