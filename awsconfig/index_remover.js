
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_topic = new (require('../lib/aws/topic.js'))();
  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws_role = new (require('../lib/aws/role.js'))();

  if (!event.federateRoleName)  event.federateRoleName = "federate";

  var roles = [];
  if (event.federateAccount) {
    roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/' + event.federateRoleName});
    var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
    if (event.roleExternalId) {
      admin_role.externalId = event.roleExternalId;
    }
    roles.push(admin_role);
  }
  console.log(roles);

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region,
    topicName : data_json.topicName,
    roleName : data_json.roleName + "-" + event.region,
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
//    {func:aws_topic.findTopic, success:aws_topic.deleteTopic, failure:aws_role.findRoleByPrefix, error:errored},
    {func:aws_topic.findTopic, success:aws_topic.isSubscribed, failure:aws_role.findRoleByPrefix, error:errored},
    {func:aws_topic.isSubscribed, success:aws_topic.unsubscribe, failure:aws_topic.deleteTopic, error:errored},
    {func:aws_topic.unsubscribe, success:aws_topic.deleteTopic, failure:aws_role.findRoleByPrefix, error:errored},
    {func:aws_topic.deleteTopic, success:aws_role.findRoleByPrefix, failure:failed, error:errored},
    {func:aws_role.findRoleByPrefix, success:aws_role.findInlinePolicy, failure:succeeded, error:errored},
    {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole, error:errored},
    {func:aws_role.deleteInlinePolicy, success:aws_role.deleteRole, failure:failed, error:errored},
    {func:aws_role.deleteRole, success:succeeded, failure:failed, error:errored},
  ];
  aws_sts.flows = flows;
  aws_topic.flows = flows;
  aws_config.flows = flows;
  aws_role.flows = flows;

  flows[0].func(input);
};
