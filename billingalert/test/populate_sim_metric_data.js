
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

var aws_sts = new (require('../../lib/aws/sts.js'))();
var aws_watch = new (require('../../lib/aws/cloudwatch.js'))();

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

function addMetricData(max) {
  max += Math.floor(max * (Math.random() / 7));
  input.metricData.MetricData[0].Timestamp = new Date;
  input.metricData.MetricData[0].Value = max;
  aws_watch.addMetricData(input);
  setInterval(function(){
    max += Math.floor(max * (Math.random() / 7));
    input.metricData.MetricData[0].Timestamp = new Date;
    input.metricData.MetricData[0].Value = max;
    aws_watch.addMetricData(input);
  }, 10 * 60 * 1000);
}

if (value > 0) {
  aws_sts.assumeRoles(input, function(err, data) {
    if (err) {
      console.log("failed to get metric statistics");
      return;
    }
    addMetricData(value);
  });
}
else {
  aws_sts.assumeRoles(input, function(err, data) {
    if (err) {
      console.log("failed to get metric statistics");
      return;
    }
    aws_watch.findMetricsStatistics(input, function(err, data) {
      if (err) {
        console.log("failed to get metric statistics");
        return;
      }
      console.log("found metric data");
      console.log(data);
      outputs = data.Datapoints;
      outputs.sort(function(a, b){return b.Timestamp - a.Timestamp});
      var max = (outputs[0]) ? outputs[0].Maximum : 100;
      console.log("Maximum value : " + max);
      addMetricData(max);
    });
  });
}
