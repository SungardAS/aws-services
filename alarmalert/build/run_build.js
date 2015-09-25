
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
var sim = param_json.sim;

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

var deployer = new (require('../../lib/lambda_deployer'))();
var aws_topic = new (require('../../lib/aws/topic'))();
var aws_lambda = new (require('../../lib/aws/lambda'))();

function build(idx, packageJSONFileNames, callback) {

  function done(input) {
    console.log(input);
    console.log("\n\nSuccessfully completed!!!");
    if (++idx == packageJSONFileNames.length) {
      if(callback)  callback(input);
    }
    else build(idx, packageJSONFileNames, callback);
  }

  var packageJSONFileName = packageJSONFileNames[idx];

  console.log("Current path = " + __dirname);
  var fs = require("fs");
  var data = fs.readFileSync(__dirname + '/' + packageJSONFileName, {encoding:'utf8'});
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
  var topicName = package_json.topicName;

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
    topicName: topicName,
    principal: "sns.amazonaws.com",
    statementId: "sns_invoke"
  };
  console.log(input);

  var flows = {
    deploy: [
      {func:aws_topic.findTopic, success:aws_lambda.findFunction},
      {func:aws_lambda.findFunction, success:aws_lambda.getPolicy},
      {func:aws_lambda.getPolicy, success:aws_topic.subscribeLambda, failure:aws_lambda.addPermission},
      {func:aws_lambda.addPermission, success:aws_topic.subscribeLambda},
      {func:aws_topic.subscribeLambda, success:done},
    ],
    clean: [
      {func:aws_topic.findTopic, success:aws_topic.listSubscriptions},
      {func:aws_topic.listSubscriptions, success:aws_topic.unsubscribeAll},
      {func:aws_topic.unsubscribeAll, success:done},
    ]
  };
  aws_topic.flows = flows[action];
  aws_lambda.flows = flows[action];

  deployer[action](input, function(params) {
    flows[action][0].func(input);
  });
}

var packageJSONFileNames = ["package_cron.json", "package_saver.json"];
build(0, packageJSONFileNames);
