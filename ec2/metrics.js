
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
  var instances = [];
  var promises = [];
  data.Reservations.forEach(function(reservation) {
    reservation.Instances.forEach(function(instance) {
      //console.log(instance);
      //console.log("\n");
      if (instance.State.Name == "running") {
        instances.push(instance);
        promises.push(getAWSCPUUtilizationMetricStatisticsByEC2Instance(instance.InstanceId));
      }
    });
  });
  return [instances, promises];
}).then(function(instances_promises) {
  var instances = instances_promises[0];
  var promises = instances_promises[1];
  return Promise.all(promises).then(function(dataArray) {
    for(var i = 0; i < dataArray.length; i++) {
      metrics = dataArray[i].Datapoints.sort(function(a, b){return b.Timestamp - a.Timestamp});
      //console.log(instances[i].InstanceId)
      //console.log(metrics);
      //console.log("\n");
      instances[i].Metrics = metrics;
    };
    return instances;
  });
}).then(function(instances) {
  instances.forEach(function(instance) {
    console.log(instance);
    console.log("\n");
  });
}).catch(function(err) {
  console.log(err);
});


function getAWSCPUUtilizationMetricStatisticsByEC2Instance(instanceId) {

  var cloudWatch = new AWS.CloudWatch({region: region});
  var startTime = new Date();
  //startTime.setHours(startTime.getHours() - 24*14);
  startTime.setHours(startTime.getHours() - 24);
  var endTime = new Date();
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
  var promise = cloudWatch.getMetricStatistics(AWSCPUUtilizationMetricQuery).promise();
  /*promise.then(function(data) {
    //console.log(data);
    //console.log(JSON.stringify(data));
    metrics = data.Datapoints.sort(function(a, b){return b.Timestamp - a.Timestamp});
    metrics.forEach(function(metric) {
      console.log(JSON.stringify(metric));
      console.log("\n");
    });
  }).catch(function(err) {
    console.log(err);
  });*/
  return promise;
}
