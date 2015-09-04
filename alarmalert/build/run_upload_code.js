
//var profile = process.env.aws_profile;
//var account = process.env.aws_account;
//var region = process.env.aws_region;
var profile = 'default';
var federateAccount = '089476987273';
var account = '876224653878';
var roleName = 'sgas_dev_admin';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'},
  {roleArn:'arn:aws:iam::' + account + ':role/' + roleName},
];
var sessionName = 'abcde';

var argv = require('minimist')(process.argv.slice(2));
var module = argv._[0];
if (!module || (module != 'cron' && module != 'eventlog')) {
  console.log(module);
  console.log("node run_upload_code cron|eventlog");
  return;
}

console.log('profile = ' + profile);
console.log('account = ' + account);
console.log('region = ' + region);
console.log('module = ' + module);

var aws_sts = new (require('../../lib/aws/sts'))();
var aws_bucket = new (require('../../lib/aws/s3bucket'))();
var zipper = new (require('../../lib/zipper/zipper'))();

console.log("Current path = " + __dirname);
var fs = require("fs");
var data = null;
if (module == 'cron') {
  data = fs.readFileSync(__dirname + '/package_cron.json', {encoding:'utf8'});
}
else if (module == 'eventlog') {
  data = fs.readFileSync(__dirname + '/package_eventlog.json', {encoding:'utf8'});
}
var package_json = JSON.parse(data);
console.log(package_json);

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
