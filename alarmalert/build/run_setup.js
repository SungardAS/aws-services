
var argv = require('minimist')(process.argv.slice(2));
var action = argv._[0];
if (!action || (action != 'deploy' && action != 'clean')) {
  console.log(action);
  console.log("node run_setup deploy|clean");
  return;
}

//var profile = process.env.aws_profile;
//var region = process.env.aws_region;
//var account = process.env.aws_account;
var profile = 'default';
var federate_account = '089476987273';
var account = '876224653878';
var roleName = 'sgas_dev_admin';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::' + federate_account + ':role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::' + federate_account + ':role/federate'},
  {roleArn:'arn:aws:iam::' + account + ':role/' + roleName},
];
var sessionName = 'abcde';

console.log('profile = ' + profile);
console.log('region = ' + region);
console.log('account = ' + account);
console.log('action = ' + action);

var aws_sts = new (require('../../lib/aws/sts'))();
var aws_watch = new (require('../../lib/aws/cloudwatch'))();
var aws_watchlog = new (require('../../lib/aws/cloudwatchlog'))();
var aws_topic = new (require('../../lib/aws/topic'))();
var aws_bucket = new (require('../../lib/aws/s3bucket'))();
var aws_role = new (require('../../lib/aws/role'))();
var aws_lambda = new (require('../../lib/aws/lambda'))();
var zipper = new (require('../../lib/zipper/zipper'))();

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/package_cron.json', {encoding:'utf8'});
var cron_package_json = JSON.parse(data);
console.log(cron_package_json);
var data = fs.readFileSync(__dirname + '/package_eventlog.json', {encoding:'utf8'});
var eventlog_package_json = JSON.parse(data);
console.log(eventlog_package_json);

var assumeRolePolicyName = cron_package_json.assumeRolePolicyName;
var roleName = cron_package_json.roleName;
var inlinePolicyName = cron_package_json.inlinePolicyName;

//// Variables for Cron Process
var cronBucketName = account + cron_package_json.bucketNamePostfix;
var cronZipFile = cron_package_json.zipFile;
var cronSourceFolder = cron_package_json.sourceFolder;
var cronKeyName = cron_package_json.keyName;
var cronSrc = cron_package_json.src;
var cronQueueName = cron_package_json.queueName
var cronAlarmName = cron_package_json.alarmName;
var cronTopicName = cron_package_json.topicName;;
var cronFunctionName = cron_package_json.functionName;
var cronHandler = cron_package_json.handler;
var cronMemorySize = cron_package_json.memorySize;
var cronTimeout = cron_package_json.timeout;

var assumeRolePolicyDocument = fs.readFileSync(__dirname + '/' + cron_package_json.assumeRolePolicyName + '.json', {encoding:'utf8'});
console.log(assumeRolePolicyDocument);

var inlinePolicyDocument = fs.readFileSync(__dirname + '/' + cron_package_json.inlinePolicyName + '.json', {encoding:'utf8'});
console.log(inlinePolicyDocument);

var CTOCronAlarm = {
  AlarmName: cronAlarmName, /* required */
  ComparisonOperator: 'GreaterThanThreshold', /* required */
  EvaluationPeriods: 1, /* required */
  MetricName: 'ApproximateNumberOfMessagesVisible', /* required */
  Namespace: 'AWS/SQS', /* required */
  Period: 60 * 1, // in seconds /* required */
  Statistic: 'Average', /* required */
  Threshold: 0, /* required */
  ActionsEnabled: true,
  AlarmActions: [],
  AlarmDescription: '',
  Dimensions: [ {Name: 'QueueName', Value: cronQueueName} ],
  InsufficientDataActions: [],
  OKActions: [],
  Unit: 'Count'
};
console.log("####CTOCronAlarm")
console.log(CTOCronAlarm)

var inputForCron = {
  profile : profile,
  roles: roles,
  sessionName: sessionName,
  region: region,
  bucketName: cronBucketName,
  keyName: cronKeyName,
  zipFile : cronZipFile,
  sourceFolder : cronSourceFolder,
  src : cronSrc,
  alarmName: cronAlarmName,
  topicName: cronTopicName,
  alarmSpec: CTOCronAlarm,
  functionName: cronFunctionName,
  handler: cronHandler,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  assumeRolePolicyDocument: assumeRolePolicyDocument,
  inlinePolicyName: inlinePolicyName,
  inlinePolicyDocument: inlinePolicyDocument,
  memorySize: cronMemorySize,
  timeout: cronTimeout,
};
console.log("####inputForCron")
console.log(inputForCron)

//// Variables to create CloudWatchLogEvent/Metric/Alarm from Notification Emails
var alertEmailBucketName = account + eventlog_package_json.bucketNamePostfix;
var alertEmailZipFile = eventlog_package_json.zipFile;
var alertEmailSourceFolder = eventlog_package_json.sourceFolder;
var alertEmailKeyName = eventlog_package_json.keyName;
var alertEmailSrc = eventlog_package_json.src;
var alertEventLogGroupName = eventlog_package_json.eventLogGroupName;
var alertEmailAlarmName = eventlog_package_json.alarmName;
var alertEmailTopicName = eventlog_package_json.topicName;
var alertEmailFunctionName = eventlog_package_json.functionName;
var alertEmailHandler = eventlog_package_json.handler;
var alertEmailMemorySize = eventlog_package_json.memorySize;
var alertEmailTimeout = eventlog_package_json.timeout;
var emailAddress = eventlog_package_json.subscriberEmail;

EmailLogEventMetricFilterDefinition = {
  filterName: 'AlertEmailGroupEvents',
  filterPattern: '{$.count > 0}',
  logGroupName: alertEventLogGroupName,
  metricTransformations: [
    {
      metricName: 'AlertEmailGroupEventCount',
      metricNamespace: 'CloudTrailMetrics',
      metricValue: '1'
    }
  ]
}

var AlertEmailAlarm = {
  AlarmName: alertEmailAlarmName, /* required */
  ComparisonOperator: 'GreaterThanThreshold', /* required */
  EvaluationPeriods: 1, /* required */
  MetricName: 'AlertEmailGroupEventCount', /* required */
  Namespace: 'CloudTrailMetrics', /* required */
  Period: 60, // in seconds /* required */
  Statistic: 'Sum', /* required */
  Threshold: 0, /* required */
  ActionsEnabled: true,
  AlarmActions: [],
  AlarmDescription: '',
  //Dimensions: [ {Name: 'QueueName', Value: cronQueueName} ],
  InsufficientDataActions: [],
  OKActions: [],
  Unit: 'Count'
};
console.log("####AlertEmailAlarm")
console.log(AlertEmailAlarm)

var inputForAlertEmail = {
  profile : profile,
  region: region,
  bucketName: alertEmailBucketName,
  keyName: alertEmailKeyName,
  zipFile : alertEmailZipFile,
  sourceFolder : alertEmailSourceFolder,
  src : alertEmailSrc,
  alarmName: alertEmailAlarmName,
  topicName: alertEmailTopicName,
  alarmSpec: AlertEmailAlarm,
  functionName: alertEmailFunctionName,
  handler: alertEmailHandler,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  assumeRolePolicyDocument: assumeRolePolicyDocument,
  inlinePolicyName: inlinePolicyName,
  inlinePolicyDocument: inlinePolicyDocument,
  memorySize: alertEmailMemorySize,
  timeout: alertEmailTimeout,
  groupName: alertEventLogGroupName,
  metricFilterDefinition: EmailLogEventMetricFilterDefinition,
  emailAddress: emailAddress,
};
console.log("####inputForAlertEmail")
console.log(inputForAlertEmail)

////// Function for CronAlarm/Topic
function runForCron(input) {
  aws_sts.flows = flowsForCron[action];
  aws_role.flows = flowsForCron[action];
  aws_topic.flows = flowsForCron[action];
  aws_watch.flows = flowsForCron[action];
  aws_bucket.flows = flowsForCron[action];
  aws_lambda.flows = flowsForCron[action];
  zipper.flows = flowsForCron[action];
  console.log(input);
  flowsForCron[action][0].func(input);
}

function setCronTopicArnInActions(input) {
  console.log('<<<Starting setCronTopicArnInActions...');
  //IncreasedPercentagesAlarm.OKActions.push(input.topicArn);
  CTOCronAlarm.AlarmActions.push(input.topicArn);
  console.log(input);
  console.log(">>>...successfully set topicArn as an alarm action");
  aws_watch.setAlarm(input);
}

////// Function for AlertEmailAlarm/Topic
function runForAlertEmail(input) {
  inputForAlertEmail.creds = input.creds;
  aws_sts.flows = flowsForAlertEmail[action];
  aws_role.flows = flowsForAlertEmail[action];
  aws_bucket.flows = flowsForAlertEmail[action];
  aws_topic.flows = flowsForAlertEmail[action];
  aws_watch.flows = flowsForAlertEmail[action];
  aws_watchlog.flows = flowsForAlertEmail[action];
  aws_lambda.flows = flowsForAlertEmail[action];
  zipper.flows = flowsForAlertEmail[action];
  console.log('<<<Starting tasks for AlertEmail Alarm/Topic...');
  console.log(inputForAlertEmail);
  flowsForAlertEmail[action][0].func(inputForAlertEmail);
}

function setAlertEmailTopicArnInActions(input) {
  console.log('<<<Starting setAlertEmailTopicArnInActions...');
  AlertEmailAlarm.AlarmActions.push(input.topicArn);
  console.log(input);
  console.log(">>>...successfully set topicArn");
  aws_watch.setAlarm(input);
}

function subscribeEmailToEventLogFunctionToCronTopic(input) {
  console.log('<<<Starting subscribeEmailToEventLogFunctionToCronTopic...');
  var localFlows = [
    {func:aws_lambda.addPermission, success:aws_topic.subscribeLambda},
    {func:aws_topic.subscribeLambda, success:done},
  ];
  aws_topic.flows = localFlows;
  aws_lambda.flows = localFlows;
  input = {
    profile : profile,
    creds: inputForAlertEmail.creds,
    region: region,
    functionName : inputForAlertEmail.functionName,
    topicArn : inputForCron.topicArn,
    functionArn : inputForAlertEmail.functionArn
  };
  aws_lambda.addPermission(input);
}

function done(input) {
  console.log(input);
  console.log("\n\nSuccessfully completed!!!");
}

////// Function flows for CronAlarm/Topic
var flowsForCron = {
  deploy: [
    {func:aws_sts.assumeRoles, success:aws_role.findRole},
    {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole},
    {func:aws_role.createRole, success:aws_role.findInlinePolicy},
    {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy},
    {func:aws_role.createInlinePolicy, success:aws_role.wait},
    {func:aws_role.wait, success:aws_bucket.findBucket},
    {func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket},
    {func:aws_bucket.createBucket, success:zipper.zip},
    {func:zipper.zip, success:aws_bucket.putObject},
    {func:aws_bucket.putObject, success:aws_topic.findTopic},
    {func:aws_topic.findTopic, success:aws_watch.findAlarm, failure:aws_topic.createTopic},
    {func:aws_topic.createTopic, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_lambda.findFunction, failure:setCronTopicArnInActions},
    {func:setCronTopicArnInActions, success:aws_watch.setAlarm},
    {func:aws_watch.setAlarm, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:aws_topic.subscribeLambda, failure:aws_lambda.createFunction},
    {func:aws_lambda.createFunction, success:aws_lambda.addPermission},
    {func:aws_lambda.addPermission, success:aws_topic.subscribeLambda},
    {func:aws_topic.subscribeLambda, success:runForAlertEmail},
  ],
  clean: [
    {func:aws_sts.assumeRoles, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:aws_lambda.deleteFunction, failure:aws_role.findInlinePolicy},
    {func:aws_lambda.deleteFunction, success:aws_role.findInlinePolicy},
    {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
    {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
    {func:aws_role.findRole, success:aws_role.deleteRole, failure:aws_topic.findTopic},
    {func:aws_role.deleteRole, success:aws_topic.findTopic},
    {func:aws_topic.findTopic, success:aws_topic.listSubscriptions, failure:aws_watch.findAlarm},
    {func:aws_topic.listSubscriptions, success:aws_topic.unsubscribeAll},
    {func:aws_topic.unsubscribeAll, success:aws_topic.deleteTopic},
    {func:aws_topic.deleteTopic, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_watch.deleteAlarm, failure:runForAlertEmail},
    {func:aws_watch.deleteAlarm, success:runForAlertEmail},
  ]
};

////// Function flows for AlertEmailAlarm/Topic
var flowsForAlertEmail = {
  deploy: [
    {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole},
    {func:aws_role.createRole, success:aws_role.findInlinePolicy},
    {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy},
    {func:aws_role.createInlinePolicy, success:aws_role.wait},
    {func:aws_role.wait, success:aws_bucket.findBucket},
    {func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket},
    {func:aws_bucket.createBucket, success:zipper.zip},
    {func:zipper.zip, success:aws_bucket.putObject},
    {func:aws_bucket.putObject, success:aws_topic.findTopic},
    {func:aws_topic.findTopic, success:aws_watchlog.findLogGroup, failure:aws_topic.createTopic},
    {func:aws_topic.createTopic, success:aws_topic.subscribeEmail},
    {func:aws_topic.subscribeEmail, success:aws_watchlog.findLogGroup},
    {func:aws_watchlog.findLogGroup, success:aws_watchlog.fincMetricFromLogGroupEvent, failure:aws_watchlog.createLogGroup},
    {func:aws_watchlog.createLogGroup, success:aws_watchlog.fincMetricFromLogGroupEvent},
    {func:aws_watchlog.fincMetricFromLogGroupEvent, success:aws_watch.findAlarm, failure:aws_watchlog.createMetricFromLogGroupEvents},
    {func:aws_watchlog.createMetricFromLogGroupEvents, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_lambda.findFunction, failure:setAlertEmailTopicArnInActions},
    {func:setAlertEmailTopicArnInActions, success:aws_watch.setAlarm},
    {func:aws_watch.setAlarm, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:done, failure:aws_lambda.createFunction},
    {func:aws_lambda.createFunction, success:subscribeEmailToEventLogFunctionToCronTopic},
  ],
  clean: [
    {func:aws_lambda.findFunction, success:aws_lambda.deleteFunction, failure:aws_role.findInlinePolicy},
    {func:aws_lambda.deleteFunction, success:aws_role.findInlinePolicy},
    {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
    {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
    {func:aws_role.findRole, success:aws_role.deleteRole, failure:aws_topic.findTopic},
    {func:aws_role.deleteRole, success:aws_topic.findTopic},
    {func:aws_topic.findTopic, success:aws_topic.listSubscriptions, failure:aws_watch.findAlarm},
    {func:aws_topic.listSubscriptions, success:aws_topic.unsubscribeAll},
    {func:aws_topic.unsubscribeAll, success:aws_topic.deleteTopic},
    {func:aws_topic.deleteTopic, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_watch.deleteAlarm, failure:aws_watchlog.fincMetricFromLogGroupEvent},
    {func:aws_watch.deleteAlarm, success:aws_watchlog.fincMetricFromLogGroupEvent},
    {func:aws_watchlog.fincMetricFromLogGroupEvent, success:aws_watchlog.deleteMetricFromLogGroupEvent, failure:aws_watchlog.deleteMetricFromLogGroupEvent},
    {func:aws_watchlog.deleteMetricFromLogGroupEvent, success:done},
  ]
};

runForCron(inputForCron);
