
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSCloudWatch() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudwatch = new AWS.CloudWatch(params);
    return cloudwatch;
  }

  me.listMetrics = function(input, callback) {

    var params = input.metricQuery;
    console.log(params);

    var self = arguments.callee;

    if (callback) {
      var cloudwatch = me.findService(input);
      cloudwatch.listMetrics(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data[0]) {
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
    cloudwatch.listMetrics(params, me.callbackFind);
  }

  me.findMetricsStatistics = function(input, callback) {

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
      //outputs.sort(function(a, b){return b.Timestamp - a.Timestamp});
      if (outputs[0]) {
        console.log("found a metric statistics");
        return outputs;
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
  /*{ Timestamp: Wed Aug 05 2015 19:48:00 GMT-0400 (EDT),
     SampleCount: 6,
     Average: 4335.6016666666665,
     Sum: 26013.61,
     Minimum: 3858.83,
     Maximum: 4676.18,
     Unit: 'None' }*/

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
