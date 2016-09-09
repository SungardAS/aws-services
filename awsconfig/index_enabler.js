
exports.handler = function (event, context) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_bucket = new (require('../lib/aws/s3bucket.js'))();
  var aws_topic = new (require('../lib/aws/topic.js'))();
  var aws_role = new (require('../lib/aws/role.js'))();
  var aws_config = new (require('../lib/aws/awsconfig.js'))();
  var aws_lambda = new (require('../lib/aws/lambda.js'))();

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

  var assumeRolePolicyDocument = fs.readFileSync(__dirname + '/json/' + data_json.assumeRolePolicyName + '.json', {encoding:'utf8'});
  console.log(assumeRolePolicyDocument);

  var inlinePolicyDocument = fs.readFileSync(__dirname + '/json/' + data_json.inlinePolicyName + '.json', {encoding:'utf8'});
  console.log(inlinePolicyDocument);

  var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region,
    deliveryChannelName : data_json.deliveryChannelName,
    configRecorderName : data_json.configRecorderName,
    bucketName : event.account + data_json.bucketNamePostfix + "." + event.region,
    topicName : data_json.topicName,
    functionName : data_json.saverFuncName,
    statementId: event.statementId, //unique string, some uuid from api
    assumeRolePolicyName: data_json.assumeRolePolicyName,
    assumeRolePolicyDocument: assumeRolePolicyDocument,
    roleName : data_json.roleName + "-" + event.region,
    roleNamePostfix: (new Date()).getTime(),
    inlinePolicyName : data_json.inlinePolicyName,
    inlinePolicyDocument: inlinePolicyDocument,
    AccountId: event.federateAccount,
    roleArn : null,
    topicArn : null,
    inlinePolicyDoc : null
  };

 function resetAuth(input)
   {
        input.creds = null;
        aws_lambda.findFunction(input);
   }

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_sts.assumeRoles, success:aws_role.findRoleByPrefix, failure:failed, error:errored},
    {func:aws_role.findRoleByPrefix, success:aws_role.findInlinePolicy, failure:aws_role.createRole, error:errored},
    {func:aws_role.createRole, success:aws_role.findInlinePolicy, failure:failed, error:errored},
    {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy, error:errored},
    {func:aws_role.createInlinePolicy, success:aws_role.wait, failure:failed, error:errored},
    {func:aws_role.wait, success:aws_bucket.findBucket, failure:failed, error:errored},
    {func:aws_bucket.findBucket, success:aws_topic.findTopic, failure:aws_bucket.createBucket, error:errored},
    {func:aws_bucket.createBucket, success:aws_topic.findTopic, failure:failed, error:errored},
    {func:aws_topic.findTopic, success:aws_topic.addPermission, failure:aws_topic.createTopic, error:errored},
    {func:aws_topic.createTopic, success:aws_topic.addPermission, failure:failed, error:errored},
    {func:aws_topic.addPermission, success:aws_config.findRecorders, failure:failed, error:errored},
    {func:aws_config.findRecorders, success:aws_config.setRoleInRecorder, failure:aws_config.setRoleInRecorder, error:errored},
    {func:aws_config.setRoleInRecorder, success:aws_config.findChannels, failure:failed, error:errored},
    {func:aws_config.findChannels, success:aws_config.findRecordersStatus, failure:aws_config.setChannel, error:errored},
    {func:aws_config.setChannel, success:aws_config.findRecordersStatus, failure:failed, error:errored},
    {func:aws_config.findRecordersStatus, success:resetAuth, failure:aws_config.startRecorder, error:errored},
    {func:aws_config.startRecorder, success:resetAuth, failure:failed, error:errored},
    {func:resetAuth, success:aws_lambda.findFunction, failure:failed, error:errored},
    {func:aws_lambda.findFunction, success:aws_lambda.addPermission, failure:failed, error:errored},
    {func:aws_lambda.addPermission, success:aws_topic.subscribeLambda, failure:failed, error:errored},
    {func:aws_topic.subscribeLambda, success:succeeded, failure:failed, error:errored},
  ];
  aws_sts.flows = flows;
  aws_bucket.flows = flows;
  aws_topic.flows = flows;
  aws_role.flows = flows;
  aws_config.flows = flows;
  aws_lambda.flows = flows;

  flows[0].func(input);
};
