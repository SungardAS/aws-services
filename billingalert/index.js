
var metrics = new (require('./metrics'))();

exports.handler = function (event, context) {

  console.log(JSON.stringify(event));
  var localRegion = event.region;
  console.log("localRegion = " + localRegion);
  var remoteRegion = 'us-east-1';

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data_' + event.account + '.json', {encoding:'utf8'});
  data_json = JSON.parse(data);
  var federateAccount = data_json.federateAccount;
  var masterBillingAccount = data_json.masterBillingAccount;
  var roleName = data_json.roleName;
  var roleExternalId = data_json.roleExternalId;
  var sessionName = data_json.sessionName;
  var durationSeconds = data_json.durationSeconds;
  var simulated = data_json.simulated;
  var billingAccounts = data_json.billingAccounts;

  var roles = [];
  roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'});
  var admin_role = {roleArn:'arn:aws:iam::' + masterBillingAccount + ':role/' + roleName};
  if (roleExternalId) {
    admin_role.externalId = roleExternalId;
  }
  roles.push(admin_role);
  console.log(roles);

  var current = new Date();
  addMetricData(0, billingAccounts, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, current, function(err, data) {
    if(err) {
      context.fail(err, null);
    }
    else {
      console.log('completed to add metrics in all account');
      context.done(null, data);
    }
  });
}

function addMetricData(idx, billingAccounts, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, current, callback) {
  var billingAccount = billingAccounts[idx];
  metrics.addMetricData(billingAccount, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, current, function(err, data) {
    if(err) {
      console.log("failed to add metrics in account[" + billingAccount + "] : " + err);
      callback(err, null);
    }
    else {
      if (!data) {
        console.log('no estimated charges metrics found in account[' + billingAccount + ']');
      }
      else {
        console.log('completed to add metrics in account[' + billingAccount + ']');
      }
      if (++idx == billingAccounts.length) {
        callback(null, true);
      }
      else {
        addMetricData(idx, billingAccounts, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, current, callback);
      }
    }
  });
};
