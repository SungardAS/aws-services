
var fs = require("fs");
var params = fs.readFileSync(__dirname + '/run_params.json', {encoding:'utf8'});
var param_json = JSON.parse(params);
console.log(param_json);

var federateAccount = param_json.federateAccount;
var account = param_json.account;
var externalId = param_json.externalId;
var federateRoleName = param_json.federateRoleName;
var roleName = param_json.roleName;
var region = param_json.region;
var sessionName = param_json.sessionName;

var argv = require('minimist')(process.argv.slice(2));
var action = argv._[0];
var profile = argv._[1];
if (!action || (action != 'deploy' && action != 'clean')) {
  console.log(action);
  console.log("node run_build deploy|clean [profile]");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('action = ' + action);

var roles = [];
if (profile) {
  roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'});
}
roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/' + federateRoleName});
roles.push({roleArn:'arn:aws:iam::' + account + ':role/' + roleName, externalId:externalId});

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
console.log(input);

function done(input) {
  console.log(input);
  console.log("\n\nSuccessfully completed!!!");
}

var deployer = new (require('../../lib/lambda_deployer'))();
var aws_sts = new (require('../../lib/aws/sts'))();
var aws_bucket = new (require('../../lib/aws/s3bucket'))();
var aws_lambda = new (require('../../lib/aws/lambda'))();

var flows = {
  deploy: [
    {func:aws_lambda.getPolicy, success:aws_bucket.findBucketNotificationConfiguration, failure:aws_lambda.addPermission},
    {func:aws_lambda.addPermission, success:aws_bucket.findBucketNotificationConfiguration},
    {func:aws_bucket.findBucketNotificationConfiguration, success:done, failure:aws_bucket.putBucketNotificationConfiguration},
    {func:aws_bucket.putBucketNotificationConfiguration, success:done},
  ],
  clean: [
    //{func:deployer.clean, success:aws_bucket.findBucketNotificationConfiguration},
    //{func:aws_bucket.findBucketNotificationConfiguration, success:aws_bucket.removeBucketNotificationConfiguration, failure:done},
    //{func:aws_bucket.removeBucketNotificationConfiguration, success:done},
    {func:done, success:done},
  ]
};
aws_sts.flows = flows[action];
aws_bucket.flows = flows[action];
aws_lambda.flows = flows[action];

console.log(input);
var deployer = new (require('../../lib/lambda_deployer'))();
deployer[action](input, function(params) {
  flows[action][0].func(input);
});
