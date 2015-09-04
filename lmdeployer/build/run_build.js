
//var profile = process.env.aws_profile;
//var account = process.env.aws_account;
//var region = process.env.aws_region;
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

var argv = require('minimist')(process.argv.slice(2));
var action = argv._[0];
if (!action || !module || (action != 'deploy' && action != 'clean')) {
  console.log(action);
  console.log("node run_build deploy|clean");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('action = ' + action);

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
deployer[action](input);
