
var argv = require('minimist')(process.argv.slice(2));
//console.dir(argv);  // { _: [ 'deploy' ], f: 'checker', m: 128, t: 3 }
var profile = argv.p;
var region = argv.r;
var value = (argv.v) ? argv.v : 20000 + Math.floor(Math.random() * 10000);

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
  functionChain: []
};

function addMetricData(profile, region) {
  var AWSCloudWatch = require('../lib/cloudwatch.js');
  var cloudwatch = new AWSCloudWatch();
  cloudwatch.addMetricData(input);
}

addMetricData(profile, region);
setInterval(function(){
  input.metricData.MetricData[0].Timestamp = new Date;
  input.metricData.MetricData[0].Value = 20000 + Math.floor(Math.random() * 10000);
  addMetricData(profile, region);
}, 10 * 60 * 1000);
