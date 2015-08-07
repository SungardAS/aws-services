
var argv = require('minimist')(process.argv.slice(2));

if (argv.sim === undefined) {
  console.log("please set --sim=true/false");
  return;
}

var profile = process.env.aws_profile;
var region = process.env.aws_region;
var account = process.env.aws_account;
var action = argv._[0];
var sim = (argv.sim == 'true') ? true: false;
console.log('profile = ' + profile);
console.log('region = ' + region);
console.log('account = ' + account);
console.log('action = ' + action);
console.log('sim = ' + sim);

var aws_watch = new (require('../lib/cloudwatch.js'))();
var aws_topic = new (require('../lib/topic.js'))();
var aws_bucket = new (require('../lib/s3bucket.js'))();
var aws_role = new (require('../lib/role.js'))();
var aws_lambda = new (require('../lib/lambda.js'))();
var zipper = new (require('../lib/zipper'))();

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/json/package_billingalert.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var bucketName = account + package_json.bucketNamePostfix;
var zipFile = package_json.zipFile;
var sourceFolder = package_json.sourceFolder;
var src = package_json.src;
var keyName = package_json.keyName;
var roleName = package_json.roleName;
var assumeRolePolicyName = package_json.assumeRolePolicyName;
var inlinePolicyName = package_json.inlinePolicyName;
var memorySize = package_json.memorySize;
var timeout = package_json.timeout;

////// Variables for IncreasedPercentagesAlarm/Topic
var alarmName = package_json.alarmName;
var topicName = package_json.topicName;;
var functionName = package_json.functionName;
if (sim) {
  alarmName = alarmName.replace('Alarm', 'SimAlarm');
  topicName = topicName.replace('Topic', 'SimTopic');
  functionName += '_sim';
}
var namespace = package_json.awsBillingMetricNamespace;
if (sim)  namespace = package_json.ctoBillingMetricNamespace
var handler = package_json.handler;

////// Variables for OverIncreasedPercentagesAlarm/Topic
var overAlarmName = 'Over' + package_json.alarmName;
var overTopicName = 'Over' + package_json.topicName;;
if (sim) {
  overAlarmName = overAlarmName.replace('Alarm', 'SimAlarm');
  overTopicName = overTopicName.replace('Topic', 'SimTopic');
}
var overMetricName = 'IncreasedPercentages';
if (sim)  overMetricName += 'Sim';
var overNamespace = package_json.ctoBillingMetricNamespace;
var overThreshold = package_json.overThreshold;
var overSubscriberEmail = package_json.overSubscriberEmail;

////// Spec for IncreasedPercentages[Sim]Alarm
var IncreasedPercentagesAlarm = {
  AlarmName: alarmName, /* required */
  ComparisonOperator: 'GreaterThanThreshold', /* required */
  EvaluationPeriods: 1, /* required */
  MetricName: 'EstimatedCharges', /* required */
  Namespace: namespace, /* required */
  Period: 60 * 1, // in seconds /* required */
  Statistic: 'Maximum', /* required */
  Threshold: 0, /* required */
  ActionsEnabled: true,
  AlarmActions: [],
  AlarmDescription: '',
  Dimensions: [ {Name: 'Currency', Value: 'USD'} ],
  InsufficientDataActions: [],
  OKActions: [],
  Unit: 'None'
};
console.log("####IncreasedPercentagesAlarm")
console.log(IncreasedPercentagesAlarm)

////// Spec for OverIncreasedPercentages[Sim]Alarm
var OverIncreasedPercentagesAlarm = {
  AlarmName: overAlarmName, /* required */
  ComparisonOperator: 'GreaterThanThreshold', /* required */
  EvaluationPeriods: 1, /* required */
  MetricName: overMetricName, /* required */
  Namespace: overNamespace, /* required */
  Period: 60 * 1, // in seconds /* required */
  Statistic: 'Maximum', /* required */
  Threshold: overThreshold, /* required */
  ActionsEnabled: true,
  AlarmActions: [],
  AlarmDescription: '',
  Dimensions: [ {Name: 'None', Value: 'Percent'} ],
  InsufficientDataActions: [],
  OKActions: [],
  Unit: 'Percent'
};
console.log("####OverIncreasedPercentagesAlarm")
console.log(OverIncreasedPercentagesAlarm)

////// input varialbes for main resources
var input = {
  profile : profile,
  region: region,
  bucketName: bucketName,
  keyName: keyName,
  alarmName: alarmName,
  topicName: topicName,
  alarmSpec: IncreasedPercentagesAlarm,
  functionName: functionName,
  handler: handler,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName: inlinePolicyName,
  memorySize: memorySize,
  timeout: timeout,
  zipFile : zipFile,
  sourceFolder : sourceFolder,
  src : src,
};

////// input varialbes for OverIncreasedPercentagesAlarm/Topic
var inputForOver = {
  profile : profile,
  region: region,
  alarmName: overAlarmName,
  topicName: overTopicName,
  alarmSpec: OverIncreasedPercentagesAlarm,
  emailAddress: overSubscriberEmail
};

////// Starting function for OverIncreasedPercentagesAlarm/Topic
function runForOverAlarm(input) {
  aws_topic.flows = flowsForOver[action];
  aws_watch.flows = flowsForOver[action];
  console.log('<<<Starting tasks for Over Alarm/Topic...');
  console.log(inputForOver);
  flowsForOver[action][0].func(inputForOver);
}

////// Function for IncreasedPercentagesAlarm/Topic
function setTopicArnInActions(input) {
  console.log('<<<Starting setTopicArnInActions...');
  //IncreasedPercentagesAlarm.OKActions.push(input.topicArn);
  IncreasedPercentagesAlarm.AlarmActions.push(input.topicArn);
  console.log(input);
  console.log(">>>...successfully set topicArn");
  aws_watch.setAlarm(input);
}

////// Function for OverIncreasedPercentagesAlarm/Topic
function setOverTopicArnInActions(input) {
  console.log('<<<Starting setOverTopicArnInActions...');
  OverIncreasedPercentagesAlarm.AlarmActions.push(input.topicArn);
  console.log(input);
  console.log(">>>...successfully set topicArn");
  aws_watch.setAlarm(input);
}

function done(input) {
  console.log(input);
  console.log("\n\nSuccessfully completed!!!");
}

////// Function flows for OverIncreasedPercentagesAlarm/Topic
var flowsForOver = {
  deploy: [
    {func:aws_topic.findTopic, success:aws_watch.findAlarm, failure:aws_topic.createTopic},
    {func:aws_topic.createTopic, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_topic.subscribeEmail, failure:setOverTopicArnInActions},
    {func:setOverTopicArnInActions, success:aws_watch.setAlarm},
    {func:aws_watch.setAlarm, success:aws_topic.subscribeEmail},
    {func:aws_topic.subscribeEmail, success:done},
  ],
  remove: [
    {func:aws_topic.findTopic, success:aws_topic.listSubscriptions, failure:aws_watch.findAlarm},
    {func:aws_topic.listSubscriptions, success:aws_topic.unsubscribeAll},
    {func:aws_topic.unsubscribeAll, success:aws_topic.deleteTopic},
    {func:aws_topic.deleteTopic, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_watch.deleteAlarm, failure:done},
    {func:aws_watch.deleteAlarm, success:done},
  ]
};

////// Function flows for IncreasedPercentagesAlarm/Topic
var flows = {
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
    {func:aws_watch.findAlarm, success:aws_lambda.findFunction, failure:setTopicArnInActions},
    {func:setTopicArnInActions, success:aws_watch.setAlarm},
    {func:aws_watch.setAlarm, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:aws_topic.subscribeLambda, failure:aws_lambda.createFunction},
    {func:aws_lambda.createFunction, success:aws_lambda.addPermission},
    {func:aws_lambda.addPermission, success:aws_topic.subscribeLambda},
    {func:aws_topic.subscribeLambda, success:runForOverAlarm},
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
    {func:aws_watch.findAlarm, success:aws_watch.deleteAlarm, failure:runForOverAlarm},
    {func:aws_watch.deleteAlarm, success:runForOverAlarm},
  ]
};

aws_role.flows = flows[action];
aws_topic.flows = flows[action];
aws_watch.flows = flows[action];
aws_bucket.flows = flows[action];
aws_lambda.flows = flows[action];
zipper.flows = flows[action];

console.log(input);
flows[action][0].func(input);
