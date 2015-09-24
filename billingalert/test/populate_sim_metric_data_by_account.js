
var argv = require('minimist')(process.argv.slice(2));
var value = (argv.v) ? argv.v : 0;

var federateAccount = '089476987273';
var account = '876224653878';
var externalId = '';

var profile = 'default';
var roleName = 'sgas_dev_admin';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'},
  {roleArn:'arn:aws:iam::' + account + ':role/' + roleName, externalId:externalId},
];
var sessionName = 'abcde';
var durationSeconds = 900;

var aws_watch = new (require('../../lib/aws/cloudwatch.js'))();
var assumeRoleProvider = new (require('../../lib/aws/assume_role_provider.js'))();

//var accounts = [{id:'089476987273', max:0}, {id:'290093585298', max:0}, {id:'876224653878', max:0}];
var accounts = [{id:'290093585298', max:0}, {id:'876224653878', max:0}];
var current = new Date();
var startTime = new Date();
current.setMinutes(current.getMinutes() - 5);
startTime.setHours(startTime.getHours() - 24);
var metricQuery = {
  StartTime: startTime,
  EndTime: current,
  MetricName: 'EstimatedCharges',
  Namespace: 'CTOBilling',
  Period: 60 * 60 * 24,
  Statistics: [
   'SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'
  ],
  Dimensions: [
    {
      Name: 'LinkedAccount',
      Value: null
    },
    {
      Name: 'Currency',
      Value: 'USD'
    }
 ],
 Unit: 'None'
};

var metricData = {
  MetricData: [
    {
      MetricName: 'EstimatedCharges',
      Dimensions: [ {Name: 'LinkedAccount', Value: null}, {Name: 'Currency', Value: 'USD'} ],
      Timestamp: null,
      Unit: 'None',
      Value: null
    }
  ],
  Namespace: 'CTOBilling'
};

var input = {
  profile: profile,
  roles: roles,
  sessionName: sessionName,
  region: region,
  metricQuery: metricQuery,
  metricData: metricData,
};

function addMetricData(account, callback) {
  input.metricData.MetricData[0].Dimensions[0].Value = account.id;
  input.metricData.MetricData[0].Timestamp = new Date;
  input.metricData.MetricData[0].Value = account.max;
  if (assumeRoleProvider.isAlmostExpired()) {
    assumeRoleProvider.getCredential(roles, sessionName, durationSeconds, profile, function(err, data) {
      if(err) {
        console.log("Failed to assume role");
        console.log(err);
      }
      else {
        input.creds = data;
        aws_watch.addMetricData(input, callback);
      }
    });
  }
  else {
    aws_watch.addMetricData(input, callback);
  }
}

function initAddMetricData(accounts, idx, callback) {
  initAddMetricDataForAllAccounts(accounts, idx, function(err, data) {
    if (err) {
      callback(err);
    }
    else {
      console.log("completed adding for all accounts");
    }
  });
  setInterval(function(){
    initAddMetricDataForAllAccounts(accounts, idx, function(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("completed adding for all accounts");
        callback(null, data);
      }
    });
  }, 10 * 60 * 1000);
}

assumeRoleProvider.getCredential(roles, sessionName, durationSeconds, profile, function(err, creds) {
  if(err) console.log(err);
  else {
    input.creds = creds;
    if (value > 0) {
      accounts.forEach(function(account) {
        account.max = value;
      });
      initAddMetricData(value, function(err, data) {
        if (err)  console.log(err);
        else console.log(data);
      });
    }
    else {
      findMetricsStatistics(accounts, 0, function(err, data) {
        if (err) {
          console.log("failed to get metric statistics");
          console.log(err);
          return;
        }
        console.log("found metric data for all accounts");
        initAddMetricData(accounts, 0, function(err, data) {
          if (err)  console.log(err);
          else console.log(data);
        });
      });
    }
  }
});

function findMetricsStatistics(accounts, idx, callback) {
  var account = accounts[idx];
  input.metricQuery.Dimensions[0].Value = account.id;
  aws_watch.findMetricsStatistics(input, function(err, data) {
    if (err) {
      console.log("failed to get metric statistics in account[" + account.id + "]");
      console.log(err);
      callback(err);
      return;
    }
    console.log("found metric data in account[" + account.id + "]");
    console.log(data);
    outputs = data.Datapoints;
    outputs.sort(function(a, b){return b.Timestamp - a.Timestamp});
    account.max = (outputs[0]) ? outputs[0].Maximum : 100;
    console.log("Maximum value : " + account.max + " in account[" + account.id + "]");
    if (++idx == accounts.length){
      console.log("completed finding for all accounts");
      callback(null, true);
    }
    else {
      findMetricsStatistics(accounts, idx, callback);
    }
  });
}

function initAddMetricDataForAllAccounts(accounts, idx, callback) {
  var account = accounts[idx];
  account.max += Math.floor(account.max * (Math.random() / 7));
  //max += Math.floor(max * 0.15);
  addMetricData(account, function(err, data) {
    if (err) {
      console.log("Failed to add metric data in account[" + account.id + "]");
      callback(err);
    }
    else {
      console.log("Successfully added metric data in account[" + account.id + "]");
      console.log(data);
      if (++idx == accounts.length) {
        callback(null, true);
      }
      else {
        initAddMetricDataForAllAccounts(accounts, idx, callback);
      }
    }
  });
}
