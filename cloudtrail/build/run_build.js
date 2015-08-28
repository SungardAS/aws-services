
//var profile = process.env.aws_profile;
//var account = process.env.aws_account;
//var region = process.env.aws_region;
var profile = 'default';
var account = '089476987273';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::089476987273:role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::089476987273:role/federate'},
  {roleArn:'arn:aws:iam::089476987273:role/sgas_dev_admin'},
];
var sessionName = 'abcde';
var federateRoleName = 'federate';

var argv = require('minimist')(process.argv.slice(2));
var action = argv._[0];
var module = argv._[1];
if (!action || !module || (action != 'deploy' && action != 'clean') || (module != 'checker' && module != 'enabler' && module != 'remover')) {
  console.log(action);
  console.log(module);
  console.log("node run_build deploy|clean checker|enabler|remover");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('action = ' + action);
console.log('module = ' + module);

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/package_cloudtrail.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var lambdaArn = 'arn:aws:iam::' + account + ':role/' + package_json.roleName;

var assumeRolePolicyDocument = fs.readFileSync(__dirname + '/' + package_json.assumeRolePolicyName + '.json', {encoding:'utf8'});
console.log(assumeRolePolicyDocument);

var inlinePolicyDocument = fs.readFileSync(__dirname + '/' + package_json.inlinePolicyName + '.json', {encoding:'utf8'});
console.log(inlinePolicyDocument);

package_json.keyName = 'nodejs/cloudtrail-' + module + '.zip';
package_json.zipFile = 'cloudtrail-' + module + '.zip';
package_json.src[0] = 'cloudtrail/index_' + module + '.js';
package_json.functionName = 'cloudtrail-' + module;
package_json.handler = 'cloudtrail/index_' + module + ".handler";

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
  federateRoleName: federateRoleName,
  lambdaArn: lambdaArn
};
console.log(input);

var deployer = new (require('../../lib/lambda_deployer'))();
deployer[action](input);
