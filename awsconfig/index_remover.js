
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_topic = new (require('../lib/aws/topic.js'))();
  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws_role = new (require('../lib/aws/role.js'))();

  var roles = [];
  roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/federate'});
  var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
  if (event.roleExternalId) {
    admin_role.externalId = event.roleExternalId;
  }
  roles.push(admin_role);
  console.log(roles);

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    sessionName: event.sessionName,
    roles: roles,
    region: event.region,
    topicName : data_json.topicName,
    roleName : data_json.roleName,
    inlinePolicyName : data_json.inlinePolicyName,
  };

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_sts.assumeRoles, success:aws_config.findRecorders, failure:failed, error:errored},
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:aws_config.findChannels, error:errored},
    {func:aws_config.findRecordersStatus, success:aws_config.stopRecorder, failure:aws_config.findChannels, error:errored},
    {func:aws_config.stopRecorder, success:aws_config.findChannels, failure:failed, error:errored},
    {func:aws_config.findChannels, success:aws_config.deleteChannel, failure:aws_topic.findTopic, error:errored},
    {func:aws_config.deleteChannel, success:aws_topic.findTopic, failure:failed, error:errored},
    {func:aws_topic.findTopic, success:aws_topic.deleteTopic, failure:succeeded, error:errored},
    {func:aws_topic.deleteTopic, success:succeeded, failure:failed, error:errored},
    /***** commented out because the role is shared by all regions!
    {func:aws_topic.findTopic, success:aws_topic.deleteTopic, failure:aws_role.findInlinePolicy, error:errored},
    {func:aws_topic.deleteTopic, success:aws_role.findInlinePolicy, failure:failed, error:errored},
    {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
    {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
    {func:aws_role.findRole, success:aws_role.deleteRole, failure:succeeded},
    {func:aws_role.deleteRole, success:succeeded},*/
  ];
  aws_sts.flows = flows;
  aws_topic.flows = flows;
  aws_config.flows = flows;
  aws_role.flows = flows;

  flows[0].func(input);
};
