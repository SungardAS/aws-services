
//var profile = process.env.aws_profile;
//var account = process.env.aws_account;
//var region = process.env.aws_region;
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

var argv = require('minimist')(process.argv.slice(2));
var action = argv._[0];
var module = argv._[1];
if (!action || !module || (action != 'deploy' && action != 'clean') || (module != 'cron' && module != 'eventlog')) {
  console.log(action);
  console.log(module);
  console.log("node run_build deploy|clean cron|eventlog");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('action = ' + action);
console.log('module = ' + module);

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = null;
if (module == 'cron') {
  data = fs.readFileSync(__dirname + '/package_cron.json', {encoding:'utf8'});
}
else if (module == 'eventlog') {
  data = fs.readFileSync(__dirname + '/package_eventlog.json', {encoding:'utf8'});
}
var package_json = JSON.parse(data);
console.log(package_json);

var assumeRolePolicyDocument = fs.readFileSync(__dirname + '/' + package_json.assumeRolePolicyName + '.json', {encoding:'utf8'});
console.log(assumeRolePolicyDocument);

var inlinePolicyDocument = fs.readFileSync(__dirname + '/' + package_json.inlinePolicyName + '.json', {encoding:'utf8'});
console.log(inlinePolicyDocument);

input = {
  profile: profile,
  roles: roles,
  sessionName: sessionName,
  region: region,
  bucketName: account + package_json.bucketNamePostfix,
  keyName: package_json.keyName,
  zipFile: package_json.zipFile,
  sourceFolder: package_json.sourceFolder,
  src: package_json.src,
  functionName: package_json.functionName,
  handler: package_json.handler,
  assumeRolePolicyName: package_json.assumeRolePolicyName,
  assumeRolePolicyDocument: assumeRolePolicyDocument,
  roleName: package_json.roleName,
  inlinePolicyName: package_json.inlinePolicyName,
  inlinePolicyDocument: inlinePolicyDocument,
  memorySize: package_json.memorySize,
  timeout: package_json.timeout,
};
console.log(input);

var deployer = new (require('../../lib/lambda_deployer'))();
deployer[action](input);
