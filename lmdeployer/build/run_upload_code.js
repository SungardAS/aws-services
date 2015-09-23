
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
var profile = argv._[0];

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);

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

input = {
  profile: profile,
  roles: roles,
  sessionName: sessionName,
  region: region,
  bucketName: bucketName,
  keyName: keyName,
  zipFile: zipFile,
  sourceFolder: sourceFolder,
  src: src
};
console.log(input);

var uploader = new (require('../../lib/file_uploader'))();
uploader.upload(input);
