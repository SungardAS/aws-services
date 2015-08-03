
var argv = require('minimist')(process.argv.slice(2));
var profile = process.env.aws_profile;
var region = process.env.aws_region;
var account = process.env.aws_account;
var action = argv._[0];
console.log('profile = ' + profile);
console.log('region = ' + region);
console.log('account = ' + account);
console.log('action = ' + action);

var memorySize = argv.m;
var timeout = argv.t;
var bucketName = account + '.sgas.cto.lambda-files';
var fileName = 'aws_services.zip';

var sim = (argv.sim == 'true') ? 'Sim': '';
var alarmName = 'IncreasedPercentages' + sim + 'Alarm';
var namespace = (sim != '') ? 'CTOBilling' : 'AWS/Billing';
var topicName = 'IncreasedPercentages' + sim + 'Topic';
var functionName = (sim != '') ? 'billing_notifier_sim' : 'billing_notifier';
var handler = 'index_notifier.handler';
var threshold = 20000;

////// Variables for OverIncreasedPercentagesAlarm/Topic
var overAlarmName = 'OverIncreasedPercentages' + sim + 'Alarm';
var overNamespace = 'CTOBilling';
var overTopicName = 'OverIncreasedPercentages' + sim + 'Topic';
var overThreshold = 10;
var subscriberEmailForOver = 'alex.ough@sungardas.com';

var AWSCloudWatch = require('../lib/cloudwatch.js');
var aws_watch = new AWSCloudWatch();
var AWSTopic = require('../lib/topic.js');
var aws_topic = new AWSTopic();
var AWSS3Bucket = require('../lib/s3bucket.js');
var aws_bucket = new AWSS3Bucket();
var AWSRole = require('../lib/role.js');
var aws_role = new AWSRole();
var AWSLambda = require('../lib/lambda.js');
var aws_lambda = new AWSLambda();
var FC = require('../lib/function_chain');
var fc = new FC();

var IncreasedPercentagesAlarm = {
  AlarmName: alarmName, /* required */
  ComparisonOperator: 'GreaterThanThreshold', /* required */
  EvaluationPeriods: 1, /* required */
  MetricName: 'EstimatedCharges', /* required */
  Namespace: namespace, /* required */
  Period: 60 * 1, // in seconds /* required */
  Statistic: 'Maximum', /* required */
  Threshold: threshold, /* required */
  ActionsEnabled: true,
  AlarmActions: [],
  AlarmDescription: '',
  Dimensions: [ {Name: 'Currency', Value: 'USD'} ],
  InsufficientDataActions: [],
  OKActions: [],
  Unit: 'None'
};

////// Spec for OverIncreasedPercentagesAlarm
var OverIncreasedPercentagesAlarm = {
  AlarmName: overAlarmName, /* required */
  ComparisonOperator: 'GreaterThanThreshold', /* required */
  EvaluationPeriods: 1, /* required */
  MetricName: 'IncreasedPercentages' + sim, /* required */
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

var input = {
  profile : profile,
  region: region,
  bucketName: bucketName,
  keyName: 'nodejs/' + fileName,
  alarmName: IncreasedPercentagesAlarm.AlarmName,
  topicName: topicName,
  alarmSpec: IncreasedPercentagesAlarm,
  functionName: functionName,
  handler: 'billing_notifier/' + handler,
  roleName: 'lambda_billing_notifier_execution',
  assumeRolePolicyName: 'lambda_assume_role_policy',
  inlinePolicyName: 'lambda_billing_notifier_execution_policy',
  memorySize: memorySize,
  timeout: timeout,
  zipFile : '../files/' + fileName
};

////// input varialbe for OverIncreasedPercentagesAlarm/Topic
var inputForOver = {
  profile : profile,
  region: region,
  alarmName: OverIncreasedPercentagesAlarm.AlarmName,
  topicName: overTopicName,
  alarmSpec: OverIncreasedPercentagesAlarm,
  emailAddress: subscriberEmailForOver
};

function setTopicArnInActions(input) {
  IncreasedPercentagesAlarm.OKActions.push(input.topicArn);
  IncreasedPercentagesAlarm.AlarmActions.push(input.topicArn);
  console.log("successfully set topicArn");
  console.log(input);
  fc.run_success_function(setTopicArnInActions, input);
}

////// Function for OverIncreasedPercentagesAlarm/Topic
function setOverTopicArnInActions(input) {
  OverIncreasedPercentagesAlarm.AlarmActions.push(input.topicArn);
  console.log("successfully set topicArn");
  console.log(input);
  fc.run_success_function(setOverTopicArnInActions, input);
}

function wait(input) {
  console.log('pause a little bit for preparing new role....')
  setTimeout(function() {
    fc.run_success_function(wait, input);
  }, 10000);
}

function done(input) {
  console.log("\n\nSuccessfully deployed!!!");
  console.log(input);
}

////// Function Chain for OverIncreasedPercentagesAlarm/Topic
var overFunctionChains = {
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

////// Starting function for OverIncreasedPercentagesAlarm/Topic
function runForOverAlarm(input) {
  input = inputForOver;
  input.functionChain = overFunctionChains[action];
  console.log(input);

  input.functionChain[0].func(input);
}

var functionChains = {
  deploy: [
    {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole},
    {func:aws_role.createRole, success:aws_role.findInlinePolicy},
    {func:aws_role.findInlinePolicy, success:wait, failure:aws_role.createInlinePolicy},
    {func:aws_role.createInlinePolicy, success:wait},
    {func:wait, success:aws_topic.findTopic},
    {func:aws_topic.findTopic, success:aws_watch.findAlarm, failure:aws_topic.createTopic},
    {func:aws_topic.createTopic, success:aws_watch.findAlarm},
    {func:aws_watch.findAlarm, success:aws_bucket.findBucket, failure:setTopicArnInActions},
    {func:setTopicArnInActions, success:aws_watch.setAlarm},
    {func:aws_watch.setAlarm, success:aws_bucket.findBucket},
    {func:aws_bucket.findBucket, success:aws_bucket.findObject},
    {func:aws_bucket.findObject, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:aws_topic.subscribeLambda, failure:aws_lambda.createFunction},
    {func:aws_lambda.createFunction, success:aws_lambda.addPermission},
    {func:aws_lambda.addPermission, success:aws_topic.subscribeLambda},
    {func:aws_topic.subscribeLambda, success:runForOverAlarm},
    {func:runForOverAlarm, success:done},
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
    {func:runForOverAlarm, success:done},
  ]
};

input.functionChain = functionChains[action];
console.log(input);

input.functionChain[0].func(input);
