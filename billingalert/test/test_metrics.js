
var metrics = new (require('../metrics'))();

var federateAccount = '089476987273';
var roleName = 'sgas_dev_admin';
var remoteAccount = '054649790173';
var remoteRoleExternalId = '0b6318ce-41ac-4774-87ae-2b6da44a78d1';
var localRegion = 'us-east-1';
var remoteRegion = 'us-east-1';

var roles = [];
roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'});
var admin_role = {roleArn:'arn:aws:iam::' + remoteAccount + ':role/' + roleName};
if (remoteRoleExternalId) {
  admin_role.externalId = remoteRoleExternalId;
}
roles.push(admin_role);
console.log(roles);
var sessionName = 'abcde';
var durationSeconds = 0;

//["876224653878", "714270045944", "622821376834", "509168795332", "442294194136", "445750067739", "404016702201"]
var billingAccount = '876224653878';
var simulated = false;
//var current = new Date(2016, 0, 10);
var current = new Date();

/*metrics.addMetricData(billingAccount, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, current, function(err, data) {
  if(err) {
    console.log("failed to add metrics in account[" + billingAccount + "] : " + err);
  }
  else {
    console.log(data);
  }
});*/

metrics.isIncreasedUsagesOver(billingAccount, localRegion, current, function(err, data) {
  if(err) {
    console.log("failed to compare increased usage in account[" + billingAccount + "] : " + err);
  }
  else {
    console.log(data);
  }
});
