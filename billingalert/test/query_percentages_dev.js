
var federateAccount = '089476987273';
var account = '290093585298';
var roleName = 'sgas_dev_admin';
var roleExternalId = 'ccb6cfce-057c-4fbc-84b9-1ee10e8b6560';
var sessionName = 'abcde';
var durationSeconds = 0;

var localRegion = 'us-east-1';
var remoteRegion = 'us-east-1';
var billingAccountId = '876224653878';
var simulated = true;

var roles = [];
roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'});
var admin_role = {roleArn:'arn:aws:iam::' + account + ':role/' + roleName};
if (roleExternalId) {
  admin_role.externalId = roleExternalId;
}
roles.push(admin_role);
console.log(roles);

var metrics = new (require('./metrics'))();
metrics.addMetricData(billingAccountId, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, function(err, data) {
  if(err) {
    console.log("failed to add metrics : " + err);
  }
  else {
    console.log(data);
  }
});
