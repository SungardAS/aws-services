
exports.handler = function (event, context) {

  console.log(JSON.stringify(event));
  var message = JSON.parse(event.Records[0].Sns.Message);
  /*{ AlarmName: 'IncreasedPercentagesSimAlarm',
    AlarmDescription: null,
    AWSAccountId: '290093585298',
    NewStateValue: 'ALARM',
    NewStateReason: 'Threshold Crossed: 1 datapoint (29149.0) was greater than the threshold (0.0).',
    StateChangeTime: '2015-07-31T20:18:07.385+0000',
    Region: 'US - N. Virginia',
    OldStateValue: 'INSUFFICIENT_DATA',
    Trigger:
     { MetricName: 'EstimatedCharges',
       Namespace: 'CTOBilling',
       Statistic: 'MAXIMUM',
       Unit: 'None',
       Dimensions: [ [Object] ],
       Period: 60,
       EvaluationPeriods: 1,
       ComparisonOperator: 'GreaterThanThreshold',
       Threshold: 0 } }*/
  console.log(message);

  var regionArray = [
    {id:'us-east-1', name:'US - N. Virginia'},
    {id:'us-west-1', name:'US - N. California'},
    {id:'us-west-2', name:'US - Oregon'},
  ];

  var AWSCloudWatch = require('../lib/cloudwatch.js');
  var aws_watch = new AWSCloudWatch();
  var AWSTopic = require('../lib/topic.js');
  var aws_topic = new AWSTopic();
  var FC = require('../lib/function_chain');
  var fc = new FC();

  // find a given region
  var regions = regionArray.filter(function(region) {
    return region.name == message.Region;
  });
  var region = (regions[0]) ? regions[0].id : regionArray[0].id;

  var sim = (message.Trigger.Namespace == 'CTOBilling') ? 'Sim' : '';
  var percentageMetricName = 'IncreasedPercentages' + sim;
  var calculatedPercentagesMetric = {
    metricName: percentageMetricName,
    namespace: 'CTOBilling',
    dimensions: [
                  {Name: 'None', Value: 'Percent'}
                ],
    unit: 'Percent'
  }

  var input = {
    region: region,
    //percent_threshold: event.percent_threshold,  // 10.0 %
    //topicName: event.topicName,
  };

  function findValue(str) {
    var fi = str.indexOf('(');
    var ti = str.indexOf(')');
    if (fi > 0 && ti > fi) {
      return str.substring(fi+1, ti);
    }
    else {
      return null;
    }
  }

  function findValues(str) {
    var ret = {max:0, threshold:0};
    var max = findValue(str);
    if (max == null) return ret;
    str = str.substring(str.indexOf(max)+max.length+1);
    var threshold = findValue(str);
    if (threshold == null) return ret;
    ret.max = parseFloat(max);
    ret.threshold = parseFloat(threshold);
    return ret;
  }

  function buildCalculatePercentagesMetricData(input) {
    var retValues = findValues(message.NewStateReason);
    console.log(retValues);
    if (retValues.max == 0 || retValues.threshold == 0) {
      console.log("can't find the changed value");
      fc.run_failure_function(buildCalculatePercentagesMetricData, input);
    }
    else {
      var percentage = ((retValues.max - retValues.threshold) / retValues.threshold) * 100;
      var metricData = {
        MetricData: [
          {
            MetricName: calculatedPercentagesMetric.metricName,
            Dimensions: calculatedPercentagesMetric.dimensions,
            Timestamp: new Date(message.StateChangeTime),
            Unit: calculatedPercentagesMetric.unit,
            Value: percentage
          }
        ],
        Namespace: calculatedPercentagesMetric.namespace
      };
      input.percentage = percentage;
      input.metricData = metricData;
      fc.run_success_function(buildCalculatePercentagesMetricData, input);
    }
  }

  /*function shouldAlert(input) {
    if (input.percentage >= input.percent_threshold) {
      console.log("percentage is equal to or more than the threshold, so we should send an alert.");
      fc.run_success_function(shouldAlert, input);
    }
    else {
      console.log("percentage is less than the threshold, so no need to send an alert.");
      fc.run_failure_function(shouldAlert, input);
    }
  }*/

  function done(input) { context.done(null, true); }

  var functionChain = [
    {func:buildCalculatePercentagesMetricData, success:aws_watch.addMetricData, failure:context.fail, error:context.fail},
    {func:aws_watch.addMetricData, success:done, failure:context.fail, error:context.fail},
    /*{func:shouldAlert, success:aws_topic.findTopic, failure:done, error:context.fail},
    {func:aws_topic.findTopic, success:aws_topic.sendNotification, failure:context.fail, error:context.fail},
    {func:aws_topic.sendNotification, success:done, failure:context.fail, error:context.fail},*/
  ]
  input.functionChain = functionChain;

  functionChain[0].func(input);
}
