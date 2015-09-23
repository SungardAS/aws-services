
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
var module = argv._[0];
var profile = argv._[1];
if (!module || (module != 'checker' && module != 'enabler' && module != 'remover')) {
  console.log(module);
  console.log("node run_upload_code checker|enabler|remover [profile]");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('module = ' + module);

var roles = [];
if (profile) {
  roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'});
}
roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/' + federateRoleName});
roles.push({roleArn:'arn:aws:iam::' + account + ':role/' + roleName, externalId:externalId});

var aws_sts = new (require('../../lib/aws/sts'))();
var aws_bucket = new (require('../../lib/aws/s3bucket'))();
var zipper = new (require('../../lib/zipper/zipper'))();

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/package_awsconfig.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

package_json.keyName = 'nodejs/awsconfig-' + module + '.zip';
package_json.zipFile = 'awsconfig-' + module + '.zip';
package_json.src[0] = 'awsconfig/index_' + module + '.js';

input = {
  profile: profile,
  roles: roles,
  sessionName: sessionName,
  region: region,
  bucketName: account + package_json.bucketNamePostfix,
  keyName: package_json.keyName,
  zipFile: package_json.zipFile,
  sourceFolder: package_json.sourceFolder,
  src: package_json.src
};

console.log(input);

var uploader = new (require('../../lib/file_uploader'))();
uploader.upload(input);
