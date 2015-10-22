
var assume_role_provider = new (require('./lib/aws/assume_role_provider'))();

var profile = 'default';
var federateAccount = '089476987273';
var account = '089476987273';
var roleName = 'sgas_dev_admin';
var roleExternalId = '88df904d-c597-40ef-8b29-b767aba1eaa4';
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
