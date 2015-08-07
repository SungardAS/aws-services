
var argv = require('minimist')(process.argv.slice(2));

var aws_role = new(require('../lib/role.js'))();
var aws_lambda = new (require('../lib/lambda.js'))();

var profile = process.env.aws_profile;
var account = process.env.aws_account;
var region = process.env.aws_region;
var group = argv._[0];

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/json/package_' + group + '.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

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
};

function succeeded() {
  console.log("Successfully completed!!")
}

//// find functions
function find(moduleName, input, callback) {
  input.functionName = group + '-' + moduleName;
  aws_lambda.findFunction(input, function(err, data) {
    if (err) {
      console.log(">>>..." + moduleName + " : not found");
      callback(input);
    }
    else {
      console.log(data);
      console.log(">>>..." + moduleName + " : found");
      remove(moduleName, input, callback);
    }
  });
}

function find_checker(input) {
  console.log("\n<<<Starting finding checker....!!")
  find('checker', input, find_enabler);
}

function find_enabler(input) {
  console.log("\n<<<Starting finding enabler....!!")
  find('enabler', input, find_remover);
}

function find_remover(input) {
  console.log("\n<<<Starting finding remover....!!")
  find('remover', input, aws_role.findInlinePolicy);
}

//// remove functions
function remove(moduleName, input, callback) {
  input.functionName = group + '-' + moduleName;
  aws_lambda.deleteFunction(input, function(err, data) {
    if (err) {
      console.log(">>>Error in removing " + moduleName + " : " + err, err.stack);
    }
    else {
      console.log(data);
      console.log(">>>...successfully removed " + moduleName)
      if (callback) callback(input);
    }
  });
}

var flows = [
  {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.findRole},
  {func:aws_role.deleteInlinePolicy, success:aws_role.findRole},
  {func:aws_role.findRole, success:aws_role.deleteRole, failure:succeeded},
  {func:aws_role.deleteRole, success:succeeded},
]
aws_role.flows = flows;
find_checker(input);
