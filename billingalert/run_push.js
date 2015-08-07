
var argv = require('minimist')(process.argv.slice(2));

var zipper = new (require('../lib/zipper'))();
var aws_bucket = new (require('../lib/s3bucket.js'))();
var aws_role = new(require('../lib/role.js'))();
var aws_lambda = new (require('../lib/lambda.js'))();

if (argv.sim === undefined) {
  console.log("please set --sim=true/false");
  return;
}

var profile = process.env.aws_profile;
var account = process.env.aws_account;
var region = process.env.aws_region;
var group = 'billingalert';
var sim = (argv.sim == 'true') ? true: false;

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/json/package_' + group + '.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var functionName = package_json.functionName;
if (sim) {
  functionName += '_sim';
}

input = {
  profile : profile,
  region: region,
  bucketName: account + package_json.bucketNamePostfix,
  keyName: package_json.keyName,
  zipFile : package_json.zipFile,
  sourceFolder : package_json.sourceFolder,
  src : package_json.src,
  roleName: package_json.roleName,
  assumeRolePolicyName: package_json.assumeRolePolicyName,
  inlinePolicyName: package_json.inlinePolicyName,
  memorySize: package_json.memorySize,
  timeout: package_json.timeout,
  functionName: functionName,
  handler: package_json.handler,
};

function succeeded() {
  console.log("Successfully completed!!")
}

var flows = [
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
  {func:aws_lambda.updateFunctionCode, success:succeeded},
  {func:aws_lambda.createFunction, success:succeeded},
]
aws_role.flows = flows;
aws_bucket.flows = flows;
aws_lambda.flows = flows;
zipper.flows = flows;
flows[0].func(input);
