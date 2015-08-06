
var inherits = require('util').inherits;
var FlowController = require('./flow_controller');
var AWS = require('aws-sdk');

function AWSCloudWatch() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudwatch = new AWS.CloudWatch({region:input.region});
    return cloudwatch;
  }

  me.findMetricsStatistics = function(input, callback) {

    //input.termInHours = 4;
    //input.metricName = 'EstimatedCharges';
    //input.namespace = 'AWS/Billing';
    //input.period = 60 * 60 * 4; // 4 hours
    /*input.statistics = [
      'SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'
    ];*/
    /*input.dimensions: [
        {
            Name: 'Currency',
            Value: 'USD'
          }
        ];*/
    //input.unit: 'None';
    var params = input.metricQuery;
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatch = me.findService(input);
      cloudwatch.getMetricStatistics(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      outputs = data.Datapoints;
      outputs.sort(function(a, b){return b.Timestamp - a.Timestamp});
      if (outputs[0]) {
        console.log("found a metric statistics");
        return outputs[0];
      }
      else {
        console.log("getMetricStatistics returns None");
        return null;
      }
    }

    self.addParams = function(found) {
      self.params.metrics = found;
    }

    var cloudwatch = me.preRun(self, input);
    cloudwatch.getMetricStatistics(params, me.callbackFind);
  }

  me.addMetricData = function(input, callback) {

    /*input.metricData = [
        {
          MetricName: 'CalculatedPercentages',
          Dimensions: [
            {
              Name: 'Increased',
              Value: 'Percent'
            }
          ],
          Timestamp: input.metrics.Timestamp,
          Unit: 'Percent',
          Value: ((input.metrics.Maximum - input.threshold) / input.threshold) * 100;
        }
      ];*/
    //input.namespace = 'CTOBilling';
    var params = input.metricData;
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatch = me.findService(input);
      cloudwatch.putMetricData(params, callback);
      return;
    }

    var cloudwatch = me.preRun(self, input);
    cloudwatch.putMetricData(params, me.callback);
  }

  me.findAlarm = function(input, callback) {

    var params = {
      //ActionPrefix: 'STRING_VALUE',
      //AlarmNamePrefix: 'STRING_VALUE',
      AlarmNames: [input.alarmName],
      //MaxRecords: 0,
      //NextToken: 'STRING_VALUE',
      //StateValue: 'OK | ALARM | INSUFFICIENT_DATA'
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatch = me.findService(input);
      cloudwatch.describeAlarms(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      console.log(data);
      var alarms = data.MetricAlarms.filter(function(alarm) {
        return alarm.AlarmName == input.alarmName;
      });
      console.log(alarms);
      if (alarms[0]) {
        console.log("found a alarm");
        console.log(alarms[0]);
        return alarms[0];
      }
      else {
        console.log("alarm '" + input.alarmName + "' not found");
        return null;
       }
    }

    var cloudwatch = me.preRun(self, input);
    cloudwatch.describeAlarms(params, me.callbackFind);
  }

  me.setAlarm = function(input, callback) {

    var params = input.alarmSpec;
    var self = arguments.callee;

    if (callback) {
      var cloudwatch = me.findService(input);
      cloudwatch.putMetricAlarm(params, callback);
      return;
    }

    var cloudwatch = me.preRun(self, input);
    cloudwatch.putMetricAlarm(params, me.callback);
  }

  me.deleteAlarm = function(input, callback) {

    var params = {
      AlarmNames: [ input.alarmName]
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatch = me.findService(input);
      cloudwatch.deleteAlarms(params, callback);
      return;
    }

    var cloudwatch = me.preRun(self, input);
    cloudwatch.deleteAlarms(params, me.callback);
  }
}

module.exports = AWSCloudWatch
