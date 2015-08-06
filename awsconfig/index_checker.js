
exports.handler = function (event, context) {

  var aws_config = new (require('../lib/awsconfig.js'))();

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: event.region
  };

  var flows = [
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:failed, error:context.fail},
    {func:aws_config.findRecordersStatus, success:aws_config.findChannels, failure:failed, error:context.fail},
    {func:aws_config.findChannels, success:aws_config.findChannelsStatus, failure:failed, error:context.fail},
    {func:aws_config.findChannelsStatus, success:succeeded, failure:failed, error:context.fail},
  ]
  aws_config.flows = flows;

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  flows[0].func(input);
};
