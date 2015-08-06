
exports.handler = function (event, context) {

  var aws_bucket = new (require('../lib/s3bucket.js'))();
  var aws_topic = new (require('../lib/topic.js'))();
  var aws_role = new (require('../lib/role.js'))();
  var aws_config = new (require('../lib/awsconfig.js'))();

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: event.region,
    deliveryChannelName : data_json.deliveryChannelName,
    configRecorderName : data_json.configRecorderName,
    bucketName : event.account + data_json.bucketNamePostfix,
    topicName : data_json.topicName,
    roleName : data_json.roleName,
    assumeRolePolicyName: data_json.assumeRolePolicyName,
    inlinePolicyName : data_json.inlinePolicyName,
    roleArn : null,
    topicArn : null,
    inlinePolicyDoc : null
  };

  var flows = [
    {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole, error:context.fail},
    {func:aws_role.createRole, success:aws_role.findInlinePolicy, failure:context.fail, error:context.fail},
    {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy, error:context.fail},
    {func:aws_role.createInlinePolicy, success:aws_role.wait, failure:context.fail, error:context.fail},
    {func:aws_role.wait, success:aws_bucket.findBucket, failure:context.fail, error:context.fail},
    {func:aws_bucket.findBucket, success:aws_topic.findTopic, failure:aws_bucket.createBucket, error:context.fail},
    {func:aws_bucket.createBucket, success:aws_topic.findTopic, failure:context.fail, error:context.fail},
    {func:aws_topic.findTopic, success:aws_config.findRecorders, failure:aws_topic.createTopic, error:context.fail},
    {func:aws_topic.createTopic, success:aws_config.findRecorders, failure:context.fail, error:context.fail},
    {func:aws_config.findRecorders, success:aws_config.setRoleInRecorder, failure:aws_config.setRoleInRecorder, error:context.fail},
    {func:aws_config.setRoleInRecorder, success:aws_config.findChannels, failure:context.fail, error:context.fail},
    {func:aws_config.findChannels, success:aws_config.findRecordersStatus, failure:aws_config.setChannel, error:context.fail},
    {func:aws_config.setChannel, success:aws_config.findRecordersStatus, failure:context.fail, error:context.fail},
    {func:aws_config.findRecordersStatus, success:done, failure:aws_config.startRecorder, error:context.fail},
    {func:aws_config.startRecorder, success:done, failure:context.fail, error:context.fail},
  ]
  input.flows = flows;
  aws_bucket.flows = flows;
  aws_topic.flows = flows;
  aws_role.flows = flows;
  aws_config.flows = flows;

  function done(input) { context.done(null, true); }

  flows[0].func(input);
};
