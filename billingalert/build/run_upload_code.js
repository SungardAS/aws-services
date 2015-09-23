
//var profile = process.env.aws_profile;
//var account = process.env.aws_account;
//var region = process.env.aws_region;
var profile = 'default';
var federateAccount = '089476987273';
//var account = '054649790173'; // CTO Master Account for billing
var account = '089476987273';
var roleName = 'sgas_dev_admin';
var externalId = '88df904d-c597-40ef-8b29-b767aba1eaa4';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'},
  {roleArn:'arn:aws:iam::' + account + ':role/' + roleName, externalId:externalId},
];
var sessionName = 'abcde';

var argv = require('minimist')(process.argv.slice(2));
if (argv.sim === undefined) {
  console.log("node run_upload_code --sim=true|false");
  return;
}
var sim = (argv.sim == 'true') ? true: false;

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = fs.readFileSync(__dirname + '/package_billingalert.json', {encoding:'utf8'});
var package_json = JSON.parse(data);
console.log(package_json);

var functionName = package_json.functionName;
if (sim) {
  package_json.keyName = package_json.keyName.replace('.zip', '_sim.zip');
  package_json.zipFile = package_json.zipFile.replace('.zip', '_sim.zip');
}

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
