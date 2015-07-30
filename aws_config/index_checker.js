
exports.handler = function (event, context) {

  var AwsConfig = require('../lib/aws_config.js');
  var aws_config = new AwsConfig();

  var input = {
    profile: event.profile,
    region: event.region
  };

  var functionChain = [
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:failed, error:context.fail},
    {func:aws_config.findRecordersStatus, success:aws_config.findChannels, failure:failed, error:context.fail},
    {func:aws_config.findChannels, success:aws_config.findChannelsStatus, failure:failed, error:context.fail},
    {func:aws_config.findChannelsStatus, success:succeeded, failure:failed, error:context.fail},
  ]
  input.functionChain = functionChain;

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }

  aws_config.findRecorders(input);
};
