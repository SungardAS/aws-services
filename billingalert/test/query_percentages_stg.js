
var federateAccount = '876224653878';
var account = '054649790173';
var roleName = 'sgas_stg_admin';
var roleExternalId = '0e8f7bf0-390b-4451-94fb-b1fd8841b04d';
var sessionName = 'abcde';
var durationSeconds = 0;

var localRegion = 'us-east-1';
var remoteRegion = 'us-east-1';
var billingAccountId = '714270045944';
var simulated = false;

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
