
var argv = require('minimist')(process.argv.slice(2));
var packageName = argv._[0];
if (!packageName) {
  console.log(packageName);
  console.log("node run_upload_code <package json file name without '.json'>");
  return;
}
console.log('package = ' + packageName);

var dirName = __dirname;
console.log("Current path = " + dirName);
var packageJSONFileName = packageName + '.json';
var assumeRoleInfoBeforeDeploy = {
  "roles": [
    {"roleArn":"arn:aws:iam::089476987273:role/cto_across_accounts"},
    {"roleArn":"arn:aws:iam::089476987273:role/federate"},
    //{"roleArn":"arn:aws:iam::054649790173:role/sgas_dev_admin", "externalId":"0b6318ce-41ac-4774-87ae-2b6da44a78d1"}
    {"roleArn":"arn:aws:iam::089476987273:role/sgas_dev_admin", "externalId":"88df904d-c597-40ef-8b29-b767aba1eaa4"}
  ],
  "sessionName": "abcde"
}

var uploader = new (require('../../lib/lambda_code_uploader'))();
uploader.upload(dirName, packageJSONFileName, assumeRoleInfoBeforeDeploy);
