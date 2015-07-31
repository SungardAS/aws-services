
function AWSCloudWatch() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findService = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudwatch = new AWS.CloudWatch({region:input.region});
    return cloudwatch;
  }

  me.findMetricsStatistics = function(input) {

    var cloudwatch = me.findService(input);

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

    cloudwatch.getMetricStatistics(params, function(err, data) {
      if (err) {
        console.log("Error in getMetricStatistics : " + err, err.stack);
        fc.run_error_function(me.findMetricsStatistics, err);
      }
      else {
        console.log(data);
        outputs = data.Datapoints;
        outputs.sort(function(a, b){return b.Timestamp - a.Timestamp});
        if (outputs.length === 0) {
          console.log("getMetricStatistics returns None");
          fc.run_failure_function(me.findMetricsStatistics, input);
        }
        else {
          input.metrics = outputs[0];
          fc.run_success_function(me.findMetricsStatistics, input);
        }
      }
    });
  }

  me.addMetricData = function(input) {

    var cloudwatch = me.findService(input);

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

    cloudwatch.putMetricData(params, function(err, data) {
      if (err) {
        console.log("Error in putMetricData : " + err, err.stack);
        fc.run_error_function(me.addMetricData, err);
      }
      else {
        console.log('metric data is successfully stored');
        console.log(data);
        fc.run_success_function(me.addMetricData, input);
      }
    });
  }

  me.findAlarm = function(input) {
    var cloudwatch = me.findService(input);
    var params = {
      //ActionPrefix: 'STRING_VALUE',
      //AlarmNamePrefix: 'STRING_VALUE',
      AlarmNames: [input.alarmName],
      //MaxRecords: 0,
      //NextToken: 'STRING_VALUE',
      //StateValue: 'OK | ALARM | INSUFFICIENT_DATA'
    };
    cloudwatch.describeAlarms(params, function(err, data) {
      if (err) {
        console.log("Error in describeAlarms : " + err, err.stack);
        fc.run_error_function(me.findAlarm, err);
      }
      else {
        console.log(data);
        var alarms = data.MetricAlarms.filter(function(alarm) {
          return alarm.AlarmName == input.alarmName;
        });
        console.log(alarms);
        if (alarms[0]) {
          console.log("found a alarm");
          console.log(alarms[0]);
          fc.run_success_function(me.findAlarm, input);
        }
        else {
          console.log("alarm '" + input.alarmName + "' not found");
          fc.run_failure_function(me.findAlarm, input);
         }
      }
    });
  }

  me.setAlarm = function(input) {
    var cloudwatch = me.findService(input);
    var params = input.alarmSpec;
    cloudwatch.putMetricAlarm(params, function(err, data) {
      if (err) {
        console.log("Error in putMetricAlarm : " + err, err.stack);
        fc.run_error_function(me.setAlarm, err);
      }
      else {
        console.log('alarm is successfully set');
        console.log(data);
        fc.run_success_function(me.setAlarm, input);
      }
    });
  }

  me.deleteAlarm = function(input) {
    var cloudwatch = me.findService(input);
    var params = {
      AlarmNames: [ input.alarmName]
    };
    cloudwatch.deleteAlarms(params, function(err, data) {
      if (err) {
        console.log("Error in deleteAlarms : " + err, err.stack);
        fc.run_error_function(me.deleteAlarm, err);
      }
      else {
        console.log('alarm is successfully deleted');
        console.log(data);
        fc.run_success_function(me.deleteAlarm, input);
      }
    });
  }
}

module.exports = AWSCloudWatch
