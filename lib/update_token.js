
/*console.log("AWS_ACCESS_KEY_ID=" + process.env["AWS_ACCESS_KEY_ID"]);
console.log("AWS_SECRET_ACCESS_KEY=" + process.env["AWS_SECRET_ACCESS_KEY"]);
console.log("AWS_SESSION_TOKEN=" + process.env["AWS_SESSION_TOKEN"]);*/

delete process.env["AWS_ACCESS_KEY_ID"];
delete process.env["AWS_SECRET_ACCESS_KEY"];
delete process.env["AWS_SESSION_TOKEN"];

/*console.log("AWS_ACCESS_KEY_ID=" + process.env["AWS_ACCESS_KEY_ID"]);
console.log("AWS_SECRET_ACCESS_KEY=" + process.env["AWS_SECRET_ACCESS_KEY"]);
console.log("AWS_SESSION_TOKEN=" + process.env["AWS_SESSION_TOKEN"]);*/

var assume_role_provider = new (require('./aws/assume_role_provider'))();

var accounts = [
  {account: '089476987273', roleExternalId: '88df904d-c597-40ef-8b29-b767aba1eaa4'},
  {account: '054649790173', roleExternalId: '0b6318ce-41ac-4774-87ae-2b6da44a78d1'}
];
var selectedAccount = accounts[0];

var profile = 'default';
var federateAccount = '089476987273';
var roleName = 'sgas_dev_admin';
var account = selectedAccount.account;
var roleExternalId = selectedAccount.roleExternalId;
var sessionName = 'abcde';
var durationSeconds = 0;

var roles = [];
if (profile) {
  roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'});
}
roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'});
var admin_role = {roleArn:'arn:aws:iam::' + account + ':role/' + roleName};
if (roleExternalId) {
  admin_role.externalId = roleExternalId;
}
roles.push(admin_role);
console.log(roles);

assume_role_provider.getCredential(roles, sessionName, durationSeconds, profile, function(err, data) {
  if(err) {
    console.log("failed to get credential : " + err);
  }
  else {
    console.log("successfully updated token");
    console.log("export AWS_ACCESS_KEY_ID=" + data.accessKeyId);
    console.log("export AWS_SECRET_ACCESS_KEY=" + data.secretAccessKey);
    console.log("export AWS_SESSION_TOKEN=" + data.sessionToken);
  }
});
