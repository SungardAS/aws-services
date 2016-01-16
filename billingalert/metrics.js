
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
  this.current = new Date();

  // metrics for EstimatedCharges
  this.AWSEstimatedChargesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'EstimatedCharges',
    Namespace: 'AWS/Billing',
    Period: 60 * 60 * 4,
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
    Period: 60 * 60 * 4,
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

  // metrics for Increased data metrics
  this.CTOIncreasedMetricData = {
    MetricData: [
      {
        MetricName: 'IncreasedPercentages',
        Dimensions: [
          {
            Name: 'LinkedAccount',
            Value: null
          }
        ],
        Timestamp: null,
        Unit: 'Percent',
        Value: null
      },
      {
        MetricName: 'IncreasedUsages',
        Dimensions: [
          {
            Name: 'LinkedAccount',
            Value: null
          }
        ],
        Timestamp: null,
        Unit: 'None',
        Value: null
      },
      {
        MetricName: 'PrevMonthAvgUsage',
        Dimensions: [
          {
            Name: 'LinkedAccount',
            Value: null
          }
        ],
        Timestamp: null,
        Unit: 'None',
        Value: null
      }
    ],
    Namespace: 'CTOBilling'
  };

  // metrics for IncreasedPercentages Query
  this.IncreasedPercentagesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'IncreasedPercentages',
    Namespace: 'CTOBilling',
    Period: 60 * 60 * 4,
    Statistics: [
     'SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'
    ],
    Dimensions: [
      {
        Name: 'LinkedAccount',
        Value: null
      }
   ],
   Unit: 'Percent'
  };

  // metrics for IncreasedUsages Query
  this.IncreasedUsagesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'IncreasedUsages',
    Namespace: 'CTOBilling',
    Period: 60 * 60 * 4,
    Statistics: [
     'Maximum'
    ],
    Dimensions: [
      {
        Name: 'LinkedAccount',
        Value: null
      }
   ],
   Unit: 'None'
  };

  // metrics for IncreasedUsages Query
  this.PrevMonthAvgUsageMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'PrevMonthAvgUsage',
    Namespace: 'CTOBilling',
    Period: 60 * 60 * 4,
    Statistics: [
     'Maximum'
    ],
    Dimensions: [
      {
        Name: 'LinkedAccount',
        Value: null
      }
   ],
   Unit: 'None'
  };

  var me = this;

  function buildAWSEstimatedChargesMetricQuery() {
    var startTime = new Date(me.current.getFullYear(), me.current.getMonth(), me.current.getDate());
    //me.current.setHours(me.current.getHours() - 1);
    startTime.setHours(startTime.getHours() - 24*14);
    me.AWSEstimatedChargesMetricQuery.StartTime = startTime;
    me.AWSEstimatedChargesMetricQuery.EndTime = me.current;
    me.AWSEstimatedChargesMetricQuery.Dimensions[0].Value = me.accountId;
    return me.AWSEstimatedChargesMetricQuery;
  }

  function buildCTOEstimatedChargesMetricQuery() {
    var startTime = new Date(me.current.getFullYear(), me.current.getMonth(), me.current.getDate());
    //me.current.setMinutes(me.current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 24*14);
    me.CTOEstimatedChargesMetricQuery.StartTime = startTime;
    me.CTOEstimatedChargesMetricQuery.EndTime = me.current;
    me.CTOEstimatedChargesMetricQuery.Dimensions[0].Value = me.accountId;
    return me.CTOEstimatedChargesMetricQuery;
  }

  function buildEstimatedChargesMetricsData() {
    console.log('<<<Starting buildEstimatedChargesMetricsData...');
    if (me.simulated) metricQuery = buildCTOEstimatedChargesMetricQuery();
    else metricQuery = buildAWSEstimatedChargesMetricQuery();
    me.remoteInput.metricQuery = metricQuery;
    //console.log(JSON.stringify(me.remoteInput));
    console.log('>>>...calling findMetricsStatistics in buildEstimatedChargesMetricsData');
    aws_watch_remote.findMetricsStatistics(me.remoteInput);
  }

  function buildIncreasedPercentagesMetricQuery() {
    console.log('<<<Starting buildIncreasedPercentagesMetricQuery...');
    var startTime = new Date(me.current.getFullYear(), me.current.getMonth(), me.current.getDate());
    //me.current.setMinutes(me.current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 24);
    me.IncreasedPercentagesMetricQuery.StartTime = startTime;
    me.IncreasedPercentagesMetricQuery.EndTime = me.current;
    me.IncreasedPercentagesMetricQuery.Dimensions[0].Value = me.accountId;
    me.localInput.metricQuery = me.IncreasedPercentagesMetricQuery;
    //console.log(JSON.stringify(me.localInput));
    console.log('>>>...calling findMetricsStatistics in buildIncreasedPercentagesMetricQuery');
    aws_watch_local.findMetricsStatistics(me.localInput);
  }

  function buildIncreasedUsagesMetricQuery(callback) {
    console.log('<<<Starting buildIncreasedUsagesMetricQuery...');
    var startTime = new Date(me.current.getFullYear(), me.current.getMonth(), me.current.getDate());
    //me.current.setMinutes(me.current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 24);
    me.IncreasedUsagesMetricQuery.StartTime = startTime;
    me.IncreasedUsagesMetricQuery.EndTime = me.current;
    me.IncreasedUsagesMetricQuery.Dimensions[0].Value = me.accountId;
    me.localInput.metricQuery = me.IncreasedUsagesMetricQuery;
    //console.log(JSON.stringify(me.localInput));
    console.log('>>>...calling findMetricsStatistics in buildIncreasedUsagesMetricQuery');
    aws_watch_local.findMetricsStatistics(me.localInput, callback);
  }

  function buildPrevMonthAvgUsageMetricQuery(callback) {
    console.log('<<<Starting buildPrevMonthAvgUsageMetricQuery...');
    var startTime = new Date(me.current.getFullYear(), me.current.getMonth(), me.current.getDate());
    //me.current.setMinutes(me.current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 24);
    me.PrevMonthAvgUsageMetricQuery.StartTime = startTime;
    me.PrevMonthAvgUsageMetricQuery.EndTime = me.current;
    me.PrevMonthAvgUsageMetricQuery.Dimensions[0].Value = me.accountId;
    me.localInput.metricQuery = me.PrevMonthAvgUsageMetricQuery;
    //console.log(JSON.stringify(me.localInput));
    console.log('>>>...calling findMetricsStatistics in buildPrevMonthAvgUsageMetricQuery');
    aws_watch_local.findMetricsStatistics(me.localInput, callback);
  }

  /*function findPrevMonthAvgUsage() {
    var firstOfThisMonth = new Date(me.current.getFullYear(), me.current.getMonth(), 1);
    var lastOfPrevMonth = new Date(firstOfThisMonth - 1);
    var metrics = me.remoteInput.metrics.filter(function(metric) {
      return metric.Timestamp <= lastOfPrevMonth;
    }).sort(function(a, b){return b.Maximum - a.Maximum});
    if (metrics.length == 0)  return null;
    var numOfDays = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth()+1, 0).getDate();
    return metrics[0].Maximum / numOfDays;
  }*/

  function getPrevMonthAvgUsage(callback) {
    console.log('<<<Starting getPrevMonthAvgUsage...');
    if (me.simulated) metricQuery = me.AWSEstimatedChargesMetricQuery;
    else metricQuery = me.CTOEstimatedChargesMetricQuery;
    var firstOfThisMonth = new Date(me.current.getFullYear(), me.current.getMonth(), 1);
    var lastOfPrevMonth = new Date(firstOfThisMonth - 1);
    var startTime = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), lastOfPrevMonth.getDate());
    startTime.setHours(startTime.getHours() - 24*7); // 1 week
    me.remoteInput.metricQuery.StartTime = startTime;
    me.remoteInput.metricQuery.EndTime = lastOfPrevMonth;
    console.log('>>>...calling findMetricsStatistics in getPrevMonthAvgUsage');
    console.log(JSON.stringify(me.remoteInput.metricQuery));
    aws_watch_remote.findMetricsStatistics(me.remoteInput, function(err, data) {
      if(err) {
        console.log("failed to get the average of previous month usages");
        callback(err);
      }
      else {
        console.log(data);
        if (data.Datapoints.length == 0)  callback(null, 0);
        else {
          var metrics = data.Datapoints.sort(function(a, b){return b.Maximum - a.Maximum});
          var numOfDays = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth()+1, 0).getDate();
          callback(null, metrics[0].Maximum / numOfDays);
        }
      }
    });
  }

  function buildIncreasedMetricsData() {

    console.log('<<<Starting buildIncreasedMetricsData...');
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
    var increased = 0;
    var percentage = 0;
    var timeStamp = metrics[0].Timestamp;
    if (metrics.length >= 2) {
      increased = metrics[0].Maximum - metrics[1].Maximum;
      if (metrics[1].Maximum > 0) {
        percentage = (increased / metrics[1].Maximum) * 100;
      }
    }

    // find the average of the previous month
    var prevMonthAveUsage = 0;
    getPrevMonthAvgUsage(function(err, data) {
      if(err) {
        console.log("failed to get the average of previous month usages");
      }
      else {
        prevMonthAveUsage = data;
      }

      console.log(increased);
      console.log(percentage);
      console.log(prevMonthAveUsage);

      currentTime = new Date();
      metricData = me.CTOIncreasedMetricData;
      metricData.MetricData[0].Timestamp = currentTime;
      metricData.MetricData[0].Value = percentage;
      metricData.MetricData[0].Dimensions[0].Value = me.accountId;
      metricData.MetricData[1].Timestamp = currentTime;
      metricData.MetricData[1].Value = increased;
      metricData.MetricData[1].Dimensions[0].Value = me.accountId;
      metricData.MetricData[2].Timestamp = currentTime;
      metricData.MetricData[2].Value = prevMonthAveUsage;
      metricData.MetricData[2].Dimensions[0].Value = me.accountId;
      me.localInput.metricData = metricData;
      //console.log(JSON.stringify(me.localInput));
      console.log('>>>...completed buildIncreasedMetricsData');
      aws_watch_local.addMetricData(me.localInput);
    });
  }

  function succeeded(input) { me.callback(null, true); }
  function failed(input) { me.callback(null, false); }
  function errored(err) { me.callback(err, null); };

  me.addMetricData = function(accountId, roles, sessionName, durationSeconds, localRegion, remoteRegion, simulated, current, callback) {

    me.accountId = accountId;
    me.localInput.region = localRegion;
    me.remoteInput.region = remoteRegion;
    me.callback = callback;
    me.simulated = simulated;
    if (current)  me.current = current;

    var flows = [
      {func:buildEstimatedChargesMetricsData, success:aws_watch_remote.findMetricsStatistics, failure:failed, error:errored},
      {func:aws_watch_remote.findMetricsStatistics, success:buildIncreasedPercentagesMetricQuery, failure:failed, error:errored},
      {func:buildIncreasedPercentagesMetricQuery, success:aws_watch_local.findMetricsStatistics, failure:failed, error:errored},
      {func:aws_watch_local.findMetricsStatistics, success:buildIncreasedMetricsData, failure:buildIncreasedMetricsData, error:errored},
      {func:buildIncreasedMetricsData, success:aws_watch_local.addMetricData, failure:failed, error:errored},
      {func:aws_watch_local.addMetricData, success:succeeded, failure:failed, error:errored},
    ]
    aws_watch_remote.flows = flows;
    aws_watch_local.flows = flows;

    provider.getCredential(roles, sessionName, durationSeconds, null, function(err, data) {
      if(err) {
        console.log("failed to get credential : " + err);
        callback(err);
      }
      else {
        console.log(data);
        me.remoteInput.creds = data;
        flows[0].func(me.remoteInput);
      }
    });
  }

  me.isIncreasedUsagesOver = function(accountId, localRegion, current, callback) {

    me.accountId = accountId;
    me.localInput.region = localRegion;
    if (current)  me.current = current;

    buildIncreasedUsagesMetricQuery(function(err, data) {
      if (err) {
        console.log("failed to find IncreasedUsagesMetric : " + err);
        callback(err);
      }
      else {
        var metrics = data.Datapoints.sort(function(a, b){return b.Timestamp - a.Timestamp});
        console.log("increasedUsages : " + JSON.stringify(metrics));
        var increasedUsages = metrics[0].Maximum;
        buildPrevMonthAvgUsageMetricQuery(function(err, data) {
          if (err) {
            console.log("failed to find prevMonthAvgUsageMetric : " + err);
            callback(err);
          }
          else {
            var metrics = data.Datapoints.sort(function(a, b){return b.Timestamp - a.Timestamp});
            console.log("prevMonthAvgUsage : " + JSON.stringify(metrics));
            var prevMonthAvgUsage = metrics[0].Maximum;
            if (prevMonthAvgUsage == 0) {
              console.log("prevMonthAvgUsage is 0, so return true");
              callback(null, true);
            }
            else {
              var bool = increasedUsages > prevMonthAvgUsage;
              console.log("increasedUsages is " + increasedUsages + " and prevMonthAvgUsage is " + prevMonthAvgUsage + ", so return " + bool);
              callback(null, bool);
            }
          }
        });
      }
    });
  }
}

module.exports = Metrics
