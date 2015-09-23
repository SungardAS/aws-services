
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
var module = argv._[1];
var profile = argv._[2];
if (!action || !module || (action != 'deploy' && action != 'clean') || (module != 'checker' && module != 'enabler' && module != 'remover')) {
  console.log(action);
  console.log(module);
  console.log("node run_build deploy|clean checker|enabler|remover [profile]");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('action = ' + action);
console.log('module = ' + module);

var roles = [];
if (profile) {
  roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'});
}
roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/' + federateRoleName});
roles.push({roleArn:'arn:aws:iam::' + account + ':role/' + roleName, externalId:externalId});

console.log("Current path = " + __dirname);
var data = fs.readFileSync(__dirname + '/package_cloudtrail.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var roleName = package_json.roleName + "_" + module;
var lambdaRoleArn = 'arn:aws:iam::' + account + ':role/' + roleName;

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
  roleName: roleName,
  inlinePolicyName: package_json.inlinePolicyName,
  inlinePolicyDocument: inlinePolicyDocument,
  memorySize: package_json.memorySize,
  timeout: package_json.timeout,
  federateRoleName: federateRoleName,
  lambdaRoleArn: lambdaRoleArn
};
console.log(input);

var deployer = new (require('../../lib/lambda_deployer'))();
deployer[action](input);
