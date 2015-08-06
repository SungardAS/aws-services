
var argv = require('minimist')(process.argv.slice(2));
var profile = process.env.aws_profile;
var region = process.env.aws_region;
var account = process.env.aws_account;
var action = argv._[0];
var func = argv.f;
console.log('profile = ' + profile);
console.log('region = ' + region);
console.log('account = ' + account);
console.log('action = ' + action);
console.log('func = ' + func);

var LambdaDeployer = require('./lambda_deployer.js');
var deployer = new LambdaDeployer();

var bucketName = account + '.sgas.cto.lambda-files';
var roleName = 'lambda_awsconfig_invoke';
var assumeRolePolicyName = 'lambda_assume_role_policy';
var inlinePolicyName = 'lambda_awsconfig_execution_policy';
var fileName = 'aws_services.zip';

var functionName = 'awsconfig-' + func;
var handler = 'awsconfig/index_' + func + '.handler';
var memorySize = argv.m;
var timeout = argv.t;

input = {
  profile : profile,
  region: region,
  bucketName: bucketName,
  roleName: roleName,
  assumeRolePolicyName: assumeRolePolicyName,
  inlinePolicyName: inlinePolicyName,
  keyName: 'nodejs/' + fileName,
  functionName: functionName,
  handler: handler,
  roleARN : null,
  memorySize: memorySize,
  timeout: timeout,
  zipFile : '../files/' + fileName
};

console.log("\nStarting to " + action + " ...\n");
console.log(input);

deployer[action](input);
