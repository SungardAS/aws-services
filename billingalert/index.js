
var provider = new (require('../lib/aws/assume_role_provider'))();
var aws_watch = new (require('../lib/aws/cloudwatch.js'))();

exports.handler = function (event, context) {

  console.log(JSON.stringify(event));
  var message = JSON.parse(event.Records[0].Sns.Message);
  console.log(message.Trigger.Dimensions);

  var region = event.Records[0].EventSubscriptionArn.split(":")[3];

  var accountId = null;
  try {
    accountId = message.Trigger.Dimensions.filter(function(dimension) {
        return dimension.name == 'LinkedAccount';
      })[0].value;
  } catch(err){}
  console.log("##AccountId = " + accountId);

  var sim = (message.Trigger.Namespace == 'CTOBilling');

  var input = {
    region: region
  };

  // metrics for EstimatedCharges
  var AWSEstimatedChargesMetricQuery = {
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
        Value: accountId
      },
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
    Period: 60,
    Statistics: [
     'SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'
    ],
    Dimensions: [
      {
        Name: 'LinkedAccount',
        Value: accountId
      },
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
            Name: 'LinkedAccount',
            Value: accountId
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

  var CTOIncreasedPercentagesSimMetricData = {
    MetricData: [
      {
        MetricName: 'IncreasedPercentagesSim',
        Dimensions: [
          {
            Name: 'LinkedAccount',
            Value: accountId
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


  function buildAWSEstimatedChargesMetricQuery() {
    var current = new Date();
    var startTime = new Date();
    //current.setHours(current.getHours() - 1);
    startTime.setHours(startTime.getHours() - 24);
    AWSEstimatedChargesMetricQuery.StartTime = startTime;
    AWSEstimatedChargesMetricQuery.EndTime = current;
    return AWSEstimatedChargesMetricQuery;
  }

  function buildCTOEstimatedChargesMetricQuery() {
    var current = new Date();
    var startTime = new Date();
    //current.setMinutes(current.getMinutes() - 5);
    startTime.setHours(startTime.getHours() - 5);
    CTOEstimatedChargesMetricQuery.StartTime = startTime;
    CTOEstimatedChargesMetricQuery.EndTime = current;
    return CTOEstimatedChargesMetricQuery;
  }

  function buildEstimatedChargesMetricsData() {
    console.log('<<<Starting buildEstimatedChargesMetricsData...');
    if (sim) metricQuery = buildCTOEstimatedChargesMetricQuery();
    else metricQuery = buildAWSEstimatedChargesMetricQuery();
    input.metricQuery = metricQuery;
    console.log(JSON.stringify(input));
    console.log('>>>...completed buildEstimatedChargesMetricsData');
    aws_watch.findMetricsStatistics(input);
  }

  function buildIncreasedPercentagesMetricsData() {
    console.log('<<<Starting buildIncreasedPercentagesMetricsData...');
    console.log(JSON.stringify(input));
    var metrics = input.metrics.sort(function(a, b){return b.Timestamp - a.Timestamp}).splice(0,2);
    console.log(JSON.stringify(metrics));
    var percentage = 0;
    if (metrics.length >= 2 && metrics[1].Maximum > 0) {
      percentage = ((metrics[0].Maximum - metrics[1].Maximum) / metrics[1].Maximum) * 100;
    }
    console.log(percentage);
    if (sim) metricData = CTOIncreasedPercentagesSimMetricData;
    else metricData = CTOIncreasedPercentagesMetricData;
    console.log(new Date(message.StateChangeTime));
    metricData.MetricData[0].Timestamp = new Date();
    metricData.MetricData[0].Value = percentage;
    input.metricData = metricData;
    console.log(JSON.stringify(input));
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
