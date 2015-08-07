
var argv = require('minimist')(process.argv.slice(2));
var profile = process.env.aws_profile;
var region = process.env.aws_region;
var value = (argv.v) ? argv.v : 15000 + Math.floor(Math.random() * 20000);

var metricData = {
  MetricData: [
    {
      MetricName: 'EstimatedCharges',
      Dimensions: [ {Name: 'Currency', Value: 'USD'} ],
      Timestamp: new Date,
      Unit: 'None',
      Value: value
    }
  ],
  Namespace: 'CTOBilling'
};

var input = {
  profile: profile,
  region: region,
  metricData: metricData,
};

function addMetricData(profile, region) {
  var cloudwatch = new (require('../lib/cloudwatch.js'))();
  cloudwatch.addMetricData(input);
}

addMetricData(profile, region);
setInterval(function(){
  input.metricData.MetricData[0].Timestamp = new Date;
  input.metricData.MetricData[0].Value = 15000 + Math.floor(Math.random() * 20000);
  addMetricData(profile, region);
}, 10 * 60 * 1000);
