
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
var federateAccount = '089476987273';
var account = '876224653878';
//var account = federateAccount;
var roleName = 'sgas_dev_admin';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'},
  {roleArn:'arn:aws:iam::' + account + ':role/' + roleName},
];
var sessionName = 'abcde';

console.log('profile = ' + profile);
console.log('region = ' + region);
console.log('account = ' + account);
console.log('action = ' + action);

var aws_sts = new (require('../../lib/aws/sts'))();
var aws_bucket = new (require('../../lib/aws/s3bucket'))();
var aws_role = new (require('../../lib/aws/role'))();
var aws_lambda = new (require('../../lib/aws/lambda'))();
var zipper = new (require('../../lib/zipper/zipper'))();

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/package_lmdeployer.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var bucketName = account + package_json.bucketNamePostfix;
var zipFile = package_json.zipFile;
var sourceFolder = package_json.sourceFolder;
var src = package_json.src;
var keyName = package_json.keyName;
var functionName = package_json.functionName;
var handler = package_json.handler;
var roleName = package_json.roleName;
var assumeRolePolicyName = package_json.assumeRolePolicyName;
var inlinePolicyName = package_json.inlinePolicyName;
var memorySize = package_json.memorySize;
var timeout = package_json.timeout;

var assumeRolePolicyDocument = fs.readFileSync(__dirname + '/' + package_json.assumeRolePolicyName + '.json', {encoding:'utf8'});
console.log(assumeRolePolicyDocument);

var inlinePolicyDocument = fs.readFileSync(__dirname + '/' + package_json.inlinePolicyName + '.json', {encoding:'utf8'});
console.log(inlinePolicyDocument);

var input = {
  profile : profile,
  roles: roles,
  sessionName: sessionName,
  region: region,
  bucketName: bucketName,
  keyName: keyName,
  functionName: functionName,
  handler: handler,
  assumeRolePolicyName: assumeRolePolicyName,
  assumeRolePolicyDocument: assumeRolePolicyDocument,
  roleName: roleName,
  inlinePolicyName: inlinePolicyName,
  inlinePolicyDocument: inlinePolicyDocument,
  memorySize: memorySize,
  timeout: timeout,
  zipFile: zipFile,
  sourceFolder: sourceFolder,
  src: src,
  principal: "s3.amazonaws.com",
  statementId: "s3_invoke"
};

function done(input) {
  console.log(input);
  console.log("\n\nSuccessfully completed!!!");
}

var flows = {
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
    {func:aws_bucket.putObject, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:aws_lambda.getPolicy, failure:aws_lambda.createFunction},
    {func:aws_lambda.createFunction, success:aws_lambda.getPolicy},
    {func:aws_lambda.getPolicy, success:aws_bucket.findBucketNotificationConfiguration, failure:aws_lambda.addPermission},
    {func:aws_lambda.addPermission, success:aws_bucket.findBucketNotificationConfiguration},
    {func:aws_bucket.findBucketNotificationConfiguration, success:done, failure:aws_bucket.putBucketNotificationConfiguration},
    {func:aws_bucket.putBucketNotificationConfiguration, success:done},
  ],
  clean: [
    {func:aws_sts.assumeRoles, success:aws_lambda.findFunction},
    {func:aws_lambda.findFunction, success:aws_lambda.deleteFunction, failure:aws_role.findInlinePolicy},
    {func:aws_lambda.deleteFunction, success:aws_role.findInlinePolicy},
    {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
    {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
    {func:aws_role.findRole, success:aws_role.deleteRole, failure:done},
    {func:aws_role.deleteRole, success:done},
  ]
};
aws_sts.flows = flows[action];
aws_role.flows = flows[action];
aws_bucket.flows = flows[action];
aws_lambda.flows = flows[action];
zipper.flows = flows[action];

console.log(input);
flows[action][0].func(input);
