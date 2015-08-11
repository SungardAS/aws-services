
var argv = require('minimist')(process.argv.slice(2));

var zipper = new (require('../lib/zipper'))();
var aws_bucket = new (require('../lib/s3bucket.js'))();
var aws_role = new(require('../lib/role.js'))();
var aws_lambda = new (require('../lib/lambda.js'))();

var profile = process.env.aws_profile;
var account = process.env.aws_account;
var region = process.env.aws_region;
var group = 'alarmalert';

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/json/package_' + group + '.json', {encoding:'utf8'});
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
var cronFunctionName = package_json.cron.functionName;
var cronHandler = package_json.cron.handler;
var cronMemorySize = package_json.cron.memorySize;
var cronTimeout = package_json.cron.timeout;

inputForCron = {
  profile : profile,
  region: region,
  bucketName: bucketName,
  keyName: keyName,
  zipFile : zipFile,
  sourceFolder : sourceFolder,
  src : src,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName: inlinePolicyName,
  memorySize: cronMemorySize,
  timeout: cronTimeout,
  functionName: cronFunctionName,
  handler: cronHandler,
};

var alertEmailFunctionName = package_json.alertEmail.functionName;
var alertEmailHandler = package_json.alertEmail.handler;
var alertEmailMemorySize = package_json.alertEmail.memorySize;
var alertEmailTimeout = package_json.alertEmail.timeout;

inputForAlertEmail = {
  profile : profile,
  region: region,
  bucketName: bucketName,
  keyName: keyName,
  zipFile : zipFile,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName: inlinePolicyName,
  memorySize: alertEmailMemorySize,
  timeout: alertEmailTimeout,
  functionName: alertEmailFunctionName,
  handler: alertEmailHandler,
};

function runForAlertEmail(input) {
  aws_lambda.flows = flowsForAlertEmail;
  console.log('<<<Starting tasks for AlertEmail...');
  console.log(inputForAlertEmail);
  flowsForAlertEmail[0].func(inputForAlertEmail);
}

function succeeded() {
  console.log("Successfully completed!!")
}

var flowsForCron = [
  {func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole},
  {func:aws_role.createRole, success:aws_role.findInlinePolicy},
  {func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy},
  {func:aws_role.createInlinePolicy, success:aws_role.wait},
  {func:aws_role.wait, success:aws_bucket.findBucket},
  {func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket},
  {func:aws_bucket.createBucket, success:zipper.zip},
  {func:zipper.zip, success:aws_bucket.putObject},
  {func:aws_bucket.putObject, success:aws_lambda.findFunction},
  {func:aws_lambda.findFunction, success:aws_lambda.updateFunctionCode, failure:aws_lambda.createFunction},
  {func:aws_lambda.updateFunctionCode, success:runForAlertEmail},
  {func:aws_lambda.createFunction, success:runForAlertEmail},
]

var flowsForAlertEmail = [
  //{func:aws_role.findRole, success:aws_role.findInlinePolicy, failure:aws_role.createRole},
  //{func:aws_role.createRole, success:aws_role.findInlinePolicy},
  //{func:aws_role.findInlinePolicy, success:aws_bucket.findBucket, failure:aws_role.createInlinePolicy},
  //{func:aws_role.createInlinePolicy, success:aws_role.wait},
  //{func:aws_role.wait, success:aws_bucket.findBucket},
  //{func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket},
  //{func:aws_bucket.createBucket, success:zipper.zip},
  //{func:zipper.zip, success:aws_bucket.putObject},
  //{func:aws_bucket.putObject, success:aws_lambda.findFunction},
  {func:aws_lambda.findFunction, success:aws_lambda.updateFunctionCode, failure:aws_lambda.createFunction},
  {func:aws_lambda.updateFunctionCode, success:succeeded},
  {func:aws_lambda.createFunction, success:succeeded},
]

aws_role.flows = flowsForCron;
aws_bucket.flows = flowsForCron;
aws_lambda.flows = flowsForCron;
zipper.flows = flowsForCron;
flowsForCron[0].func(inputForCron);
