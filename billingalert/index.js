
var aws_watch = new (require('../lib/aws/cloudwatch.js'))();
var aws_topic = new (require('../lib/aws/topic.js'))();

exports.handler = function (event, context) {

  console.log(JSON.stringify(event));
  var message = JSON.parse(event.Records[0].Sns.Message);
  console.log(message);

  var regionArray = [
    {id:'us-east-1', name:'US - N. Virginia'},
    {id:'us-west-1', name:'US - N. California'},
    {id:'us-west-2', name:'US - Oregon'},
  ];

  // find a given region
  var regions = regionArray.filter(function(region) {
    return region.name == message.Region;
  });
  var region = (regions[0]) ? regions[0].id : regionArray[0].id;

  var sim = (message.Trigger.Namespace == 'CTOBilling');

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: region,
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
    var ret = {max:-1, threshold:-1};
    var max = findValue(str);
    if (max == null) return ret;
    str = str.substring(str.indexOf(max)+max.length+1);
    var threshold = findValue(str);
    if (threshold == null) return ret;
    ret.max = parseFloat(max);
    ret.threshold = parseFloat(threshold);
    return ret;
  }

  // metrics for EstimatedCharges
  var AWSEstimatedChargesMetricQuery = {
    StartTime: null,
    EndTime: null,
    MetricName: 'EstimatedCharges',
    Namespace: 'AWS/Billing',
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

  var CTOEstimatedChargesMetricQuery = {
    StartTime: null,
    EndTime: null,
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

  // metrics for IncreasedPercentages
  var CTOIncreasedPercentagesMetricData = {
    MetricData: [
      {
        MetricName: 'IncreasedPercentages',
        Dimensions: [
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

  var CTOIncreasedPercentagesSimMetricData = {
    MetricData: [
      {
        MetricName: 'IncreasedPercentagesSim',
        Dimensions: [
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


  function buildAWSEstimatedChargesMetricQuery() {
    var current = new Date();
    var startTime = new Date();
    current.setHours(current.getHours() - 1);
    startTime.setHours(startTime.getHours() - 25);
    AWSEstimatedChargesMetricQuery.StartTime = startTime;
    AWSEstimatedChargesMetricQuery.EndTime = current;
    return AWSEstimatedChargesMetricQuery;
  }

  function buildCTOEstimatedChargesMetricQuery() {
    var current = new Date();
    var startTime = new Date();
    current.setMinutes(current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 20);
    CTOEstimatedChargesMetricQuery.StartTime = startTime;
    CTOEstimatedChargesMetricQuery.EndTime = current;
    return CTOEstimatedChargesMetricQuery;
  }

  function buildEstimatedChargesMetricsData(event) {
    console.log('<<<Starting buildEstimatedChargesMetricsData...');
    if (sim) metricQuery = buildCTOEstimatedChargesMetricQuery();
    else metricQuery = buildAWSEstimatedChargesMetricQuery();
    input.metricQuery = metricQuery;
    console.log(input);
    console.log('>>>...completed buildEstimatedChargesMetricsData');
    aws_watch.findMetricsStatistics(input);
  }

  function buildIncreasedPercentagesMetricsData(event) {
    console.log('<<<Starting buildIncreasedPercentagesMetricsData...');
    var retValues = findValues(message.NewStateReason);
    console.log(retValues);
    if (retValues.max == -1 || retValues.threshold == -1) {
      console.log("can't find the changed value");
      context.done(null, false);
    }
    var percentage = ((retValues.max - input.metrics.Maximum) / input.metrics.Maximum) * 100;
    if (sim) metricData = CTOIncreasedPercentagesSimMetricData;
    else metricData = CTOIncreasedPercentagesMetricData;
    metricData.MetricData[0].Timestamp = new Date(message.StateChangeTime);
    metricData.MetricData[0].Value = percentage;
    input.metricData = metricData;
    console.log(input);
    console.log('>>>...completed buildIncreasedPercentagesMetricsData');
    aws_watch.addMetricData(input);
  }

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); };

  var flows = [
    {func:buildEstimatedChargesMetricsData, success:aws_watch.findMetricsStatistics, failure:failed, error:errored},
    {func:aws_watch.findMetricsStatistics, success:buildIncreasedPercentagesMetricsData, failure:failed, error:errored},
    {func:buildIncreasedPercentagesMetricsData, success:aws_watch.addMetricData, failure:failed, error:errored},
    {func:aws_watch.addMetricData, success:succeeded, failure:failed, error:errored},
  ]
  aws_watch.flows = flows;
  flows[0].func(input);
}
