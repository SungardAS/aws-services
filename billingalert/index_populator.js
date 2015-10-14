
var aws_watch = new (require('../lib/aws/cloudwatch.js'))();

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
  region: "us-east-1",
  metricQuery: metricQuery,
  metricData: metricData,
};

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

function initAddMetricData(accounts, idx, callback) {
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
        initAddMetricData(accounts, idx, callback);
      }
    }
  });
}

function addMetricData(account, callback) {
  input.metricData.MetricData[0].Dimensions[0].Value = account.id;
  input.metricData.MetricData[0].Timestamp = new Date;
  input.metricData.MetricData[0].Value = account.max;
  aws_watch.addMetricData(input, callback);
}

exports.handler = function (event, context) {
  findMetricsStatistics(accounts, 0, function(err, data) {
    if (err) {
      console.log("failed to get metric statistics : " + err);
      context.fail(err);
    }
    console.log("found metric data for all accounts");
    initAddMetricData(accounts, 0, function(err, data) {
      if (err) {
        console.log(err);
        context.fail(err);
      }
      else {
        console.log(data);
        context.done(null, true);
      }
    });
  });
}
