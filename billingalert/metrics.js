
var provider = new (require('../lib/aws/assume_role_provider'))();
var aws_watch_remote = new (require('../lib/aws/cloudwatch.js'))();
var aws_watch_local = new (require('../lib/aws/cloudwatch.js'))();

function Metrics() {

  this.remoteInput = {
    region: null
  };

  this.localInput = {
    region: null
  };

  this.callback = null;
  this.simulated = false;

  // metrics for EstimatedCharges
  this.AWSEstimatedChargesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'EstimatedCharges',
    Namespace: 'AWS/Billing',
    Period: 60 * 60,
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

  this.CTOEstimatedChargesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'EstimatedCharges',
    Namespace: 'CTOBilling',
    Period: 60,
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

  // metrics for IncreasedPercentages Query
  this.IncreasedPercentagesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'IncreasedPercentages',
    Namespace: 'CTOBilling',
    Period: 60,
    Statistics: [
     'SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'
    ],
    Dimensions: [
      {
        Name: 'LinkedAccount',
        Value: null
      },
      {
        Name: 'None',
        Value: 'Percent'
      }
   ],
   Unit: 'Percent'
  };

  // metrics for IncreasedPercentages
  this.CTOIncreasedPercentagesMetricData = {
    MetricData: [
      {
        MetricName: 'IncreasedPercentages',
        Dimensions: [
          {
            Name: 'LinkedAccount',
            Value: null
          },
          {
            Name: 'None',
            Value: 'Percent'
          }
        ],
        Timestamp: null,
        Unit: 'Percent',
        Value: null
      }
    ],
    Namespace: 'CTOBilling'
  };

  var me = this;


  function buildAWSEstimatedChargesMetricQuery() {
    var current = new Date();
    var startTime = new Date();
    //current.setHours(current.getHours() - 1);
    startTime.setHours(startTime.getHours() - 24);
    me.AWSEstimatedChargesMetricQuery.StartTime = startTime;
    me.AWSEstimatedChargesMetricQuery.EndTime = current;
    me.AWSEstimatedChargesMetricQuery.Dimensions[0].Value = me.accountId;
    return me.AWSEstimatedChargesMetricQuery;
  }

  function buildCTOEstimatedChargesMetricQuery() {
    var current = new Date();
    var startTime = new Date();
    //current.setMinutes(current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 5);
    me.CTOEstimatedChargesMetricQuery.StartTime = startTime;
    me.CTOEstimatedChargesMetricQuery.EndTime = current;
    me.CTOEstimatedChargesMetricQuery.Dimensions[0].Value = me.accountId;
    return me.CTOEstimatedChargesMetricQuery;
  }

  function buildEstimatedChargesMetricsData() {
    console.log('<<<Starting buildEstimatedChargesMetricsData...');
    if (me.simulated) metricQuery = buildCTOEstimatedChargesMetricQuery();
    else metricQuery = buildAWSEstimatedChargesMetricQuery();
    me.remoteInput.metricQuery = metricQuery;
    //console.log(JSON.stringify(me.remoteInput));
    console.log('>>>...completed buildEstimatedChargesMetricsData');
    aws_watch_remote.findMetricsStatistics(me.remoteInput);
  }

  function buildIncreasedPercentagesMetricQuery() {
    console.log('<<<Starting buildIncreasedPercentagesMetricQuery...');
    var current = new Date();
    var startTime = new Date();
    //current.setMinutes(current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 24);
    me.IncreasedPercentagesMetricQuery.StartTime = startTime;
    me.IncreasedPercentagesMetricQuery.EndTime = current;
    me.IncreasedPercentagesMetricQuery.Dimensions[0].Value = me.accountId;
    me.localInput.metricQuery = me.IncreasedPercentagesMetricQuery;
    //console.log(JSON.stringify(me.localInput));
    console.log('>>>...completed buildIncreasedPercentagesMetricQuery');
    aws_watch_local.findMetricsStatistics(me.localInput);
  }

  function buildIncreasedPercentagesMetricsData() {

    console.log('<<<Starting buildIncreasedPercentagesMetricsData...');
    //console.log(JSON.stringify(me.remoteInput));
    var metrics = me.remoteInput.metrics.sort(function(a, b){return b.Timestamp - a.Timestamp}).splice(0,2);
    console.log("***EST CHARGE METRICS : " + JSON.stringify(metrics));

    // check if the new metric data has been generated in remoteRegion
    var percentageMetrics = me.localInput.metrics;
    if (me.localInput.metrics && me.localInput.metrics.length >= 2) {
      percentageMetrics = me.localInput.metrics.sort(function(a, b){return b.Timestamp - a.Timestamp}).splice(0,2);
    }
    console.log("***PERCENTAGE METRICS : " + JSON.stringify(percentageMetrics));
    if (percentageMetrics && percentageMetrics[0] && metrics[0]) {
      console.log("percentage metrics time : " + percentageMetrics[0].Timestamp);
      console.log("est charge metrics time : " + metrics[0].Timestamp);
      if (percentageMetrics[0].Timestamp.getTime() >= metrics[0].Timestamp.getTime()) {
        console.log("no new EstimatedChargeds metric data, so just return");
        me.callback(null, true);
        return;
      }
    }
    var percentage = 0;
    if (metrics.length >= 2 && metrics[1].Maximum > 0) {
      percentage = ((metrics[0].Maximum - metrics[1].Maximum) / metrics[1].Maximum) * 100;
    }
    console.log(percentage);
    metricData = me.CTOIncreasedPercentagesMetricData;
    metricData.MetricData[0].Timestamp = new Date();
    metricData.MetricData[0].Value = percentage;
    metricData.MetricData[0].Dimensions[0].Value = me.accountId;
    me.localInput.metricData = metricData;
    //console.log(JSON.stringify(me.localInput));
    console.log('>>>...completed buildIncreasedPercentagesMetricsData');
    aws_watch_local.addMetricData(me.localInput);
  }

  function succeeded(input) { me.callback(null, true); }
  function failed(input) { me.callback(null, false); }
  function errored(err) { me.callback(err, null); };

  me.addMetricData = function(accountId, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, callback) {

    me.accountId = accountId;
    me.localInput.region = localRegion;
    me.remoteInput.region = remoteRegion;
    me.callback = callback;
    me.simulated = simulated;

    var flows = [
      {func:buildEstimatedChargesMetricsData, success:aws_watch_remote.findMetricsStatistics, failure:failed, error:errored},
      {func:aws_watch_remote.findMetricsStatistics, success:buildIncreasedPercentagesMetricQuery, failure:failed, error:errored},
      {func:buildIncreasedPercentagesMetricQuery, success:aws_watch_local.findMetricsStatistics, failure:failed, error:errored},
      {func:aws_watch_local.findMetricsStatistics, success:buildIncreasedPercentagesMetricsData, failure:buildIncreasedPercentagesMetricsData, error:errored},
      {func:buildIncreasedPercentagesMetricsData, success:aws_watch_local.addMetricData, failure:failed, error:errored},
      {func:aws_watch_local.addMetricData, success:succeeded, failure:failed, error:errored},
    ]
    aws_watch_remote.flows = flows;
    aws_watch_local.flows = flows;

    provider.getCredential(roles, sessionName, durationSeconds, null, function(err, data) {
      if(err) console.log("failed");
      else {
        console.log(data);
        me.remoteInput.creds = data;
        flows[0].func(me.remoteInput);
      }
    });
  }
}

module.exports = Metrics

