
var argv = require('minimist')(process.argv.slice(2));
var value = (argv.v) ? argv.v : 0;
//var profile = process.env.aws_profile;
//var region = process.env.aws_region;
var profile = 'default';
var federateAccount = '089476987273';
//var account = '054649790173'; // CTO Master Account for billing
var account = '876224653878';
var roleName = 'sgas_dev_admin';
var region = 'us-east-1';
var roles = [
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::' + federateAccount + ':role/federate'},
  {roleArn:'arn:aws:iam::' + account + ':role/' + roleName},
];
var sessionName = 'abcde';
var durationSeconds = 900;

var aws_watch = new (require('../../lib/aws/cloudwatch.js'))();
var assumeRoleProvider = new (require('../../lib/aws/assume_role_provider.js'))();

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
      Dimensions: [ {Name: 'Currency', Value: 'USD'} ],
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

function addMetricData(max, callback) {
  input.metricData.MetricData[0].Timestamp = new Date;
  input.metricData.MetricData[0].Value = max;
  if (assumeRoleProvider.isAlmostExpired()) {
    assumeRoleProvider.getCredential(roles, sessionName, durationSeconds, profile, function(err, data) {
      if(err) console.log(err);
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

function initAddMetricData(max, callback) {
  max += Math.floor(max * (Math.random() / 7));
  addMetricData(max, function(err, data) {
    if (err) {
      console.log("Failed to add metric data");
      callback(err);
    }
    else {
      console.log(data);
      callback(null, data);
    }
  });
  setInterval(function(){
    max += Math.floor(max * (Math.random() / 7));
    addMetricData(max, function(err, data) {
      if (err) {
        console.log("Failed to add metric data");
        console.log(err);
      }
      else {
        console.log(data);
        callback(null, data);
      }
    });
  }, 10 * 60 * 1000);
}

assumeRoleProvider.getCredential(roles, sessionName, durationSeconds, profile, function(err, data) {
  if(err) console.log(err);
  else {
    input.creds = data;
    if (value > 0) {
        initAddMetricData(value, function(err, data) {
          if (err)  console.log(err);
          else console.log(data);
        });
    }
    else {
      aws_watch.findMetricsStatistics(input, function(err, data) {
        if (err) {
          console.log("failed to get metric statistics");
          console.log(err);
          return;
        }
        console.log("found metric data");
        console.log(data);
        outputs = data.Datapoints;
        outputs.sort(function(a, b){return b.Timestamp - a.Timestamp});
        var max = (outputs[0]) ? outputs[0].Maximum : 100;
        console.log("Maximum value : " + max);
        initAddMetricData(max, function(err, data) {
          if (err)  console.log(err);
          else console.log(data);
        });
      });
    }
  }
});
