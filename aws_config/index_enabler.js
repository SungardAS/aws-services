
exports.handler = function (event, context) {

  var AWSTopic = require('../lib/topic.js');
  var aws_topic = new AWSTopic();
  var AWSRole = require('../lib/role.js');
  var aws_role = new AWSRole();
  var AwsConfig = require('../lib/aws_config.js');
  var aws_config = new AwsConfig();

  var input = {
    profile : event.profile,
    region: event.region,
    deliveryChannelName : event.deliveryChannelName,
    configRecorderName : event.configRecorderName,
    bucketName : event.bucketName,
    topicName : event.topicName,
    roleName : event.roleName,
    inlinePolicyName : event.inlinePolicyName,
    roleArn : null,
    topicArn : null,
    inlinePolicyDoc : null
  };

  var functionChain = [
    {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:context.fail, error:context.fail},
    {func:aws_role.findInlinePolicy, success:aws_topic.findTopic, failure:context.fail, error:context.fail},
    {func:aws_topic.findTopic, success:aws_config.findRecorders, failure:aws_topic.createTopic, error:context.fail},
    {func:aws_topic.createTopic, success:aws_config.findRecorders, failure:context.fail, error:context.fail},
    {func:aws_config.findRecorders, success:aws_config.findChannels, failure:aws_config.setRoleInRecorder, error:context.fail},
    {func:aws_config.setRoleInRecorder, success:aws_config.findChannels, failure:context.fail, error:context.fail},
    {func:aws_config.findChannels, success:aws_config.findRecordersStatus, failure:aws_config.setChannel, error:context.fail},
    {func:aws_config.setChannel, success:aws_config.findRecordersStatus, failure:context.fail, error:context.fail},
    {func:aws_config.findRecordersStatus, success:done, failure:aws_config.startRecorder, error:context.fail},
    {func:aws_config.startRecorder, success:done, failure:context.fail, error:context.fail},
  ]
  input.functionChain = functionChain;

  function done(input) { context.done(null, true); }

  aws_role.findRole(input);
};
