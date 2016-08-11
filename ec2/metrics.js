
// aws cloudwatch get-metric-statistics --metric-name CPUUtilization --start-time 2016-08-01T00:00:00 --end-time 2016-08-11T15:00:00 --period 1440 --namespace AWS/EC2 --statistics Minimum --dimensions Name=InstanceId,Value=<your-instance-id>

var AWS = require('aws-sdk');

var region = 'us-east-1';
var ec2 = new AWS.EC2({region: region});
var params = {
  /*DryRun: true || false,
  Filters: [
    {
      Name: 'STRING_VALUE',
      Values: [
        'STRING_VALUE',
        * more items *
      ]
    },
    * more items *
  ],
  InstanceIds: [
    'STRING_VALUE',
    * more items *
  ],
  MaxResults: 0,
  NextToken: 'STRING_VALUE'*/
};
var promise = ec2.describeInstances(params).promise();
promise.then(function(data) {
  //console.log(JSON.stringify(data));
  data.Reservations.forEach(function(reservation) {
    reservation.Instances.forEach(function(instance) {
      console.log(JSON.stringify(instance));
      console.log("\n");
    });
  });
}).catch(function(err) {
  console.log(err);
});


var AWS = require('aws-sdk');
var region = 'us-east-1';

var instanceId = '';
var current = new Date();
var cloudWatch = new AWS.CloudWatch({region: region});
var startTime = new Date(current.getFullYear(), current.getMonth(), current.getDate());
startTime.setHours(startTime.getHours() - 24*14);
var endTime = current;
var AWSCPUUtilizationMetricQuery = {
  StartTime: startTime,
  EndTime: endTime,
  MetricName: 'CPUUtilization',
  Namespace: 'AWS/EC2',
  Period: 60 * 60 * 4,
  Statistics: [
   'SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'
  ],
  Dimensions: [
    {
      Name: 'InstanceId',
      Value: instanceId
    }
 ],
 Unit: 'Percent'
};
var params = AWSCPUUtilizationMetricQuery;
var promise = cloudWatch.getMetricStatistics(params).promise();
promise.then(function(data) {
  //console.log(data);
  //console.log(JSON.stringify(data));
  metrics = data.Datapoints.sort(function(a, b){return b.Timestamp - a.Timestamp});
  metrics.forEach(function(metric) {
    console.log(JSON.stringify(metric));
    console.log("\n");
  });
}).catch(function(err) {
  console.log(err);
});
