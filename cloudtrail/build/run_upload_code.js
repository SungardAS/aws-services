
//var profile = process.env.aws_profile;
//var account = process.env.aws_account;
//var region = process.env.aws_region;
var profile = 'default';
var account = '089476987273';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::089476987273:role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::089476987273:role/federate'},
  {roleArn:'arn:aws:iam::089476987273:role/sgas_dev_admin', externalId:'4939a983-fa81-42d0-a93c-9cb63daa1bd6'},
];
var sessionName = 'abcde';
var federateRoleName = 'federate';

var argv = require('minimist')(process.argv.slice(2));
var module = argv._[0];
if (!module || (module != 'checker' && module != 'enabler' && module != 'remover')) {
  console.log(module);
  console.log("node run_upload_code checker|enabler|remover");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('module = ' + module);

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/package_cloudtrail.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

package_json.keyName = 'nodejs/cloudtrail-' + module + '.zip';
package_json.zipFile = 'cloudtrail-' + module + '.zip';
package_json.src[0] = 'cloudtrail/index_' + module + '.js';

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
