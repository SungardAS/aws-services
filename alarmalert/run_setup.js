
var argv = require('minimist')(process.argv.slice(2));

var profile = process.env.aws_profile;
var region = process.env.aws_region;
var account = process.env.aws_account;
var action = argv._[0];
console.log('profile = ' + profile);
console.log('region = ' + region);
console.log('account = ' + account);
console.log('action = ' + action);

var aws_watch = new (require('../lib/cloudwatch.js'))();
var aws_watchlog = new (require('../lib/cloudwatchlog.js'))();
var aws_topic = new (require('../lib/topic.js'))();
var aws_bucket = new (require('../lib/s3bucket.js'))();
var aws_role = new (require('../lib/role.js'))();
var aws_lambda = new (require('../lib/lambda.js'))();
var zipper = new (require('../lib/zipper'))();

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/json/package_alarmalert.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var bucketName = account + package_json.zip.bucketNamePostfix;
var zipFile = package_json.zip.zipFile;
var sourceFolder = package_json.zip.sourceFolder;
var src = package_json.zip.src;
var keyName = package_json.zip.keyName;
var roleName = package_json.lambda.roleName;
var assumeRolePolicyName = package_json.lambda.assumeRolePolicyName;
var inlinePolicyName = package_json.lambda.inlinePolicyName;
var emailAddress = package_json.alertEmail.subscriberEmail;

//// Variables for Cron Process
var cronQueueName = package_json.cron.queueName
var cronAlarmName = package_json.cron.alarmName;
var cronTopicName = package_json.cron.topicName;;
var cronFunctionName = package_json.cron.functionName;
var cronHandler = package_json.cron.handler;
var cronMemorySize = package_json.cron.memorySize;
var cronTimeout = package_json.cron.timeout;

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
  region: region,
  bucketName: bucketName,
  keyName: keyName,
  alarmName: cronAlarmName,
  topicName: cronTopicName,
  alarmSpec: CTOCronAlarm,
  functionName: cronFunctionName,
  handler: cronHandler,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName: inlinePolicyName,
  memorySize: cronMemorySize,
  timeout: cronTimeout,
  zipFile : zipFile,
  sourceFolder : sourceFolder,
  src : src,
};
console.log("####inputForCron")
console.log(inputForCron)

//// Variables to create CloudWatchLogEvent/Metric/Alarm from Notification Emails
var alertEventLogGroupName = package_json.alertEmail.eventLogGroupName;
var alertEmailAlarmName = package_json.alertEmail.alarmName;
var alertEmailTopicName = package_json.alertEmail.topicName;
var alertEmailFunctionName = package_json.alertEmail.functionName;
var alertEmailHandler = package_json.alertEmail.handler;
var alertEmailMemorySize = package_json.alertEmail.memorySize;
var alertEmailTimeout = package_json.alertEmail.timeout;

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
  Period: 60 , // in seconds /* required */
  Statistic: 'SampleCount', /* required */
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
  bucketName: bucketName,
  keyName: keyName,
  alarmName: alertEmailAlarmName,
  topicName: alertEmailTopicName,
  alarmSpec: AlertEmailAlarm,
  functionName: alertEmailFunctionName,
  handler: alertEmailHandler,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName: inlinePolicyName,
  memorySize: alertEmailMemorySize,
  timeout: alertEmailTimeout,
  zipFile : zipFile,
  sourceFolder : sourceFolder,
  src : src,
  groupName: alertEventLogGroupName,
  metricFilterDefinition: EmailLogEventMetricFilterDefinition,
  emailAddress: emailAddress,
};
console.log("####inputForAlertEmail")
console.log(inputForAlertEmail)

////// Function for CronAlarm/Topic
function runForCron(input) {
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
  console.log(">>>...successfully set topicArn");
  aws_watch.setAlarm(input);
}

////// Function for AlertEmailAlarm/Topic
function runForAlertEmail(input) {
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
    region: region,
    functionName : inputForAlertEmail.functionName,
    topicArn : inputForCron.topicArn,
    functionArn : inputForAlertEmail.functionArn
  };
  aws_lambda.addPermission(input);
  console.log(">>>...successfully subscribed EmailToEventLogFunction To CronTopic");
}

function done(input) {
  console.log(input);
  console.log("\n\nSuccessfully completed!!!");
}

////// Function flows for CronAlarm/Topic
var flowsForCron = {
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
  remove: [
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
    {func:aws_bucket.findBucket, success:aws_topic.findTopic},
    //{func:aws_bucket.createBucket, success:zipper.zip},
    //{func:zipper.zip, success:aws_bucket.putObject},
    //{func:aws_bucket.putObject, success:aws_topic.findTopic},
    {func:aws_topic.findTopic, success:aws_topic.subscribeEmail, failure:aws_topic.createTopic},
    {func:aws_topic.createTopic, success:aws_topic.subscribeEmail},
    {func:aws_topic.subscribeEmail, success:aws_watchlog.findLogGroup},
    {func:aws_watchlog.findLogGroup, success:aws_watchlog.createMetricFromLogGroupEvents, failure:aws_watchlog.createLogGroup},
    {func:aws_watchlog.createLogGroup, success:aws_watchlog.createMetricFromLogGroupEvents},
    {func:aws_watchlog.createMetricFromLogGroupEvents, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_lambda.findFunction, failure:setAlertEmailTopicArnInActions},
    {func:setAlertEmailTopicArnInActions, success:aws_watch.setAlarm},
    {func:aws_watch.setAlarm, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:subscribeEmailToEventLogFunctionToCronTopic, failure:aws_lambda.createFunction},
    {func:aws_lambda.createFunction, success:subscribeEmailToEventLogFunctionToCronTopic},
  ],
  remove: [
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
    //{func:aws_watch.findAlarm, success:aws_watch.deleteAlarm, failure:runForAlertEmail},
    //{func:aws_watch.deleteAlarm, success:runForAlertEmail},
  ]
};

runForCron(inputForCron);
