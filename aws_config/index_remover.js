
exports.handler = function (event, context) {

  var AWSTopic = require('../lib/topic.js');
  var aws_topic = new AWSTopic();
  //var AWSRole = require('../lib/role.js');
  //var aws_role = new AWSRole();
  var AwsConfig = require('../lib/aws_config.js');
  var aws_config = new AwsConfig();

  var input = {
    profile : event.profile,
    region: event.region,
    topicName : event.topicName
  };

  var functionChain = [
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:aws_config.findChannels, error:context.fail},
    {func:aws_config.findRecordersStatus, success:aws_config.stopRecorder, failure:aws_config.findChannels, error:context.fail},
    {func:aws_config.stopRecorder, success:aws_config.findChannels, failure:context.fail, error:context.fail},
    {func:aws_config.findChannels, success:aws_config.deleteChannel, failure:aws_topic.findTopic, error:context.fail},
    {func:aws_config.deleteChannel, success:aws_topic.findTopic, failure:context.fail, error:context.fail},
    {func:aws_topic.findTopic, success:aws_topic.deleteTopic, failure:done, error:context.fail},
    {func:aws_topic.deleteTopic, success:done, failure:context.fail, error:context.fail},
  ]
  input.functionChain = functionChain;

  function done(input) { context.done(null, true); }

  aws_config.findRecorders(input);

};
