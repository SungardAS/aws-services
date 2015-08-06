
var argv = require('minimist')(process.argv.slice(2));

var zipper = new (require('../lib/zipper'))();
var aws_bucket = new (require('../lib/s3bucket.js'))();
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
  functionName: package_json.functionName,
  handler: package_json.handler,
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
  find('remover', input, deploy_checker);
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

/*function remove_checker(input) {
  remove('checker', input, remove_enabler);
  console.log("checker ... successfully removed!!")
}

function remove_enabler(input) {
  remove('enabler', input, remove_remover);
  console.log("enabler ... successfully removed!!")
}

function remove_remover(input) {
  remove('remover', input, deploy_checker);
  console.log("remover ... successfully removed!!")
}*/

//// deploy functions
function deploy(moduleName, input, callback) {
  input.functionName = group + '-' + moduleName;
  input.handler = group + '/index_' + moduleName + '.handler';
  aws_lambda.createFunction(input, function(err, data) {
    if (err) {
      console.log(">>>Error in deploying " + moduleName + " : " + err, err.stack);
    }
    else {
      console.log(data);
      console.log(">>>...successfully deployed " + moduleName)
      if (callback) callback(input);
    }
  });
}

function deploy_checker(input) {
  console.log("\n<<<Starting deploying checker....!!")
  deploy('checker', input, deploy_enabler);
}

function deploy_enabler(input) {
  console.log("\n<<<Starting deploying enbler....!!")
  deploy('enabler', input, deploy_remover);
}

function deploy_remover(input) {
  console.log("\n<<<Starting deploying remover....!!")
  deploy('remover', input, succeeded);
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
  {func:aws_bucket.putObject, success:find_checker},
]
aws_role.flows = flows;
aws_bucket.flows = flows;
zipper.flows = flows;
flows[0].func(input);
