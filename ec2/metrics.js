
// aws cloudwatch get-metric-statistics --metric-name CPUUtilization --start-time 2016-08-01T00:00:00 --end-time 2016-08-11T15:00:00 --period 1440 --namespace AWS/EC2 --statistics Minimum --dimensions Name=InstanceId,Value=<your-instance-id>

var AWS = require('aws-sdk');
var region = 'us-east-1';

function processAllInstances() {
  getRunningEC2Instances().then(function(instances) {
    var promises = [];
    for(var idx = 0; idx < instances.length; idx++) {
      promises.push(getEC2InstanceUserData(instances[idx]));
    }
    return Promise.all(promises).then(function(userDataArray) {
      for(var idx = 0; idx < instances.length; idx++) {
        instances[idx].UserData = userDataArray[idx];
      }
      return instances;
    });
  }).then(function(instances) {
    var promises = [];
    for(var idx = 0; idx < instances.length; idx++) {
      promises.push(getVolumeInfo(instances[idx]));
    }
    return Promise.all(promises).then(function(volumesArray) {
      for(var idx = 0; idx < instances.length; idx++) {
        instances[idx].Volumes = volumesArray[idx];
      }
      return instances;
    });
  }).then(function(instances) {
    var promises = [];
    for(var idx = 0; idx < instances.length; idx++) {
      promises.push(getAWSCPUUtilizationMetricStatisticsByEC2Instance(instances[idx]));
    }
    return Promise.all(promises).then(function(instanceMetricsArray) {
      return instanceMetricsArray;
    });
  }).then(function(instanceMetricsArray) {
    instanceMetricsArray.forEach(function(instanceMetrics) {
      console.log(JSON.stringify(instanceMetrics));
      console.log("\n");
      if (instanceMetrics.metrics.Maximum < 10) {
        console.log("***sending notification");
        sendSNSNotification(instanceMetrics).then(function(ret) {
          console.log("\n\n");
          console.log("return from sns notification");
          console.log(ret);
        }).catch(function(err) {
          console.log(err);
        })
      }
      /*
      { instance:
       { InstanceId: 'i-0b28cea778446f462',
         ImageId: 'ami-880f12e2',
         State: { Code: 16, Name: 'running' },
         PrivateDnsName: 'ip-10-0-0-182.ec2.internal',
         PublicDnsName: 'ec2-184-72-85-136.compute-1.amazonaws.com',
         StateTransitionReason: '',
         KeyName: 'kevinkey',
         AmiLaunchIndex: 0,
         ProductCodes: [],
         InstanceType: 'm3.xlarge',
         LaunchTime: '2016-07-19T14:28:52.000Z',
         Placement:
          { AvailabilityZone: 'us-east-1a',
            GroupName: '',
            Tenancy: 'default' },
         Monitoring: { State: 'disabled' },
         SubnetId: 'subnet-38f5d24e',
         VpcId: 'vpc-a28446c5',
         PrivateIpAddress: '10.0.0.182',
         PublicIpAddress: '184.72.85.136',
         Architecture: 'x86_64',
         RootDeviceType: 'ebs',
         RootDeviceName: '/dev/sda1',
         BlockDeviceMappings: [
          { DeviceName: '/dev/sda1',
            Ebs:
             { VolumeId: 'vol-048ed784689f5a303',
               Status: 'attached',
               AttachTime: '2016-07-19T14:28:53.000Z',
               DeleteOnTermination: true }
          } ],
         VirtualizationType: 'hvm',
         InstanceLifecycle: 'spot',
         SpotInstanceRequestId: 'sir-024hfx2l',
         ClientToken: '89a9b1ac-3c50-44f8-99c6-d5ced6ac1903',
         Tags: [ { Key: 'Name', Value: 'ringmaster002-e002-compute' } ],
         SecurityGroups: [
          { GroupName: 'ringmaster002-e002-infra-CharroSecurityGroup-1IEATCJ2VF84B',
            GroupId: 'sg-b0d9edcb' } ],
         SourceDestCheck: true,
         Hypervisor: 'xen',
         NetworkInterfaces: [ { NetworkInterfaceId: 'eni-84c50781',
            SubnetId: 'subnet-38f5d24e',
            VpcId: 'vpc-a28446c5',
            Description: '',
            OwnerId: '546276914724',
            Status: 'in-use',
            MacAddress: '0a:47:8f:9d:0e:f3',
            PrivateIpAddress: '10.0.0.182',
            PrivateDnsName: 'ip-10-0-0-182.ec2.internal',
            SourceDestCheck: true,
            Groups: [ [Object] ],
            Attachment:
             { AttachmentId: 'eni-attach-6fd192bf',
               DeviceIndex: 0,
               Status: 'attached',
               AttachTime: '2016-07-19T14:28:52.000Z',
               DeleteOnTermination: true },
            Association:
             { PublicIp: '184.72.85.136',
               PublicDnsName: 'ec2-184-72-85-136.compute-1.amazonaws.com',
               IpOwnerId: 'amazon' },
            PrivateIpAddresses: [ [Object] ] } ],
         IamInstanceProfile:
          { Arn: 'arn:aws:iam::546276914724:instance-profile/charreada/ringmaster002-e002-compute-CharroComputeInstanceProfile-1E7WE55NX7XBL',
            Id: 'AIPAIDYFRMDHBZ52EHM5K' },
         EbsOptimized: false,
         UserData: "",
         Volumes: [] },
      metrics:
       { Timestamp: '2016-08-15T15:48:00.000Z',
         SampleCount: 235,
         Average: 96.13408510638297,
         Sum: 22591.51,
         Minimum: 94.62,
         Maximum: 97.75,
         Unit: 'Percent' }
      }
      */
    });
  }).catch(function(err) {
    console.log(err);
  });
}

function getRunningEC2Instances() {
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
  return promise.then(function(data) {
    //console.log(JSON.stringify(data));
    var instances = [];
    var promises = [];
    data.Reservations.forEach(function(reservation) {
      reservation.Instances.forEach(function(instance) {
        //console.log(instance);
        //console.log("\n");
        if (instance.State.Name == "running") {
          instances.push(instance);
        }
      });
    });
    //console.log(instances);
    return instances;
  });
}

function getEC2InstanceUserData(instance) {
  var ec2 = new AWS.EC2({region: region});
  var params = {
    Attribute: 'userData',
    InstanceId: instance.InstanceId
    //DryRun: true || false
  };
  return ec2.describeInstanceAttribute(params).promise().then(function(data) {
    //console.log(JSON.stringify(data));
    return data.UserData.Value;
  });
}

function getVolumeInfo(instance) {
  var ec2 = new AWS.EC2({region: region});
  var params = {
    //DryRun: true || false,
    /*Filters: [
      {
        Name: 'STRING_VALUE',
        Values: [
          'STRING_VALUE',
          * more items *
        ]
      },
      * more items *
    ],
    MaxResults: 0,
    NextToken: 'STRING_VALUE',*/
    VolumeIds: instance.BlockDeviceMappings.map(function(dev) { return dev.Ebs.VolumeId})
  };
  return ec2.describeVolumes(params).promise().then(function(data) {
    return data.Volumes;
  });
}

function getAutoScalingGroup() {
  var autoscaling = new AWS.AutoScaling({region: region});
  var params = {
    /*AutoScalingGroupNames: [
      'STRING_VALUE',
      * more items *
    ],*/
    //MaxRecords: 0,
    //NextToken: 'STRING_VALUE'
  };
  return autoscaling.describeAutoScalingGroups(params).promise().then(function(data) {
    return data.AutoScalingGroups;
  });
  /*
  { ResponseMetadata: { RequestId: 'b19ed85e-6474-11e6-8bfd-a510cb1c2ddc' },
  AutoScalingGroups:
   [ { AutoScalingGroupName: 'dev-api-AppDebug-KCW42RPGEL95-AppInstanceGroup-2F20I0LSPB86',
       AutoScalingGroupARN: 'arn:aws:autoscaling:us-east-1:089476987273:autoScalingGroup:f6a2c69a-d701-4c4a-b28e-966e87450c96:autoScalingGroupName/dev-api-AppDebug-KCW42RPGEL95-AppInstanceGroup-2F20I0LSPB86',
       LaunchConfigurationName: 'dev-api-AppDebug-KCW42RPGEL95-LaunchConfig-FJ5YL8IMD532',
       MinSize: 0,
       MaxSize: 1,
       DesiredCapacity: 0,
       DefaultCooldown: 300,
       AvailabilityZones: [ 'us-east-1a', 'us-east-1b', 'us-east-1d' ],
       LoadBalancerNames: [],
       TargetGroupARNs: [],
       HealthCheckType: 'EC2',
       HealthCheckGracePeriod: 180,
       Instances: [],
       CreatedTime: Sat Feb 06 2016 17:24:09 GMT-0600 (CST),
       SuspendedProcesses: [],
       VPCZoneIdentifier: 'subnet-31c47847,subnet-110ac83b,subnet-2b4b9c73',
       EnabledMetrics: [],
       Tags: [ { ResourceId: 'dev-api-AppDebug-KCW42RPGEL95-AppInstanceGroup-2F20I0LSPB86',
          ResourceType: 'auto-scaling-group',
          Key: 'Name',
          Value: 'debug-dev-api.msaws.sungardas.io',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-AppDebug-KCW42RPGEL95-AppInstanceGroup-2F20I0LSPB86',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:logical-id',
          Value: 'AppInstanceGroup',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-AppDebug-KCW42RPGEL95-AppInstanceGroup-2F20I0LSPB86',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:stack-id',
          Value: 'arn:aws:cloudformation:us-east-1:089476987273:stack/dev-api-AppDebug-KCW42RPGEL95/9ea94ef0-cd28-11e5-9c56-50d5caf92cd2',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-AppDebug-KCW42RPGEL95-AppInstanceGroup-2F20I0LSPB86',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:stack-name',
          Value: 'dev-api-AppDebug-KCW42RPGEL95',
          PropagateAtLaunch: true } ],
       TerminationPolicies: [ 'Default' ],
       NewInstancesProtectedFromScaleIn: false },
     { AutoScalingGroupName: 'dev-api-AppStack-1LJ0B53SUJFWM-AppInstanceGroup-LZUTYV5TFL9C',
       AutoScalingGroupARN: 'arn:aws:autoscaling:us-east-1:089476987273:autoScalingGroup:fc16589f-3bdb-473f-bbcb-ae37349a682a:autoScalingGroupName/dev-api-AppStack-1LJ0B53SUJFWM-AppInstanceGroup-LZUTYV5TFL9C',
       LaunchConfigurationName: 'dev-api-AppStack-1LJ0B53SUJFWM-LaunchConfig-1DFULVTDDAUP0',
       MinSize: 0,
       MaxSize: 9,
       DesiredCapacity: 1,
       DefaultCooldown: 300,
       AvailabilityZones: [ 'us-east-1a', 'us-east-1b', 'us-east-1d' ],
       LoadBalancerNames: [ 'dev-api-A-LoadBala-57HZHSZHMK8Q' ],
       TargetGroupARNs: [],
       HealthCheckType: 'EC2',
       HealthCheckGracePeriod: 180,
       Instances: [{ InstanceId: 'i-a5f7153c',
          AvailabilityZone: 'us-east-1a',
          LifecycleState: 'InService',
          HealthStatus: 'Healthy',
          LaunchConfigurationName: 'dev-api-AppStack-1LJ0B53SUJFWM-LaunchConfig-1DFULVTDDAUP0',
          ProtectedFromScaleIn: false }],
       CreatedTime: Sat Feb 06 2016 17:16:39 GMT-0600 (CST),
       SuspendedProcesses: [],
       VPCZoneIdentifier: 'subnet-110ac83b,subnet-2b4b9c73,subnet-31c47847',
       EnabledMetrics: [],
       Tags: [ { ResourceId: 'dev-api-AppStack-1LJ0B53SUJFWM-AppInstanceGroup-LZUTYV5TFL9C',
          ResourceType: 'auto-scaling-group',
          Key: 'Name',
          Value: 'dev-api.msaws.sungardas.io',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-AppStack-1LJ0B53SUJFWM-AppInstanceGroup-LZUTYV5TFL9C',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:logical-id',
          Value: 'AppInstanceGroup',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-AppStack-1LJ0B53SUJFWM-AppInstanceGroup-LZUTYV5TFL9C',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:stack-id',
          Value: 'arn:aws:cloudformation:us-east-1:089476987273:stack/dev-api-AppStack-1LJ0B53SUJFWM/91fa5970-cd27-11e5-ba2e-500c28903236',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-AppStack-1LJ0B53SUJFWM-AppInstanceGroup-LZUTYV5TFL9C',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:stack-name',
          Value: 'dev-api-AppStack-1LJ0B53SUJFWM',
          PropagateAtLaunch: true } ],
       TerminationPolicies: [ 'Default' ],
       NewInstancesProtectedFromScaleIn: false },
     { AutoScalingGroupName: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
       AutoScalingGroupARN: 'arn:aws:autoscaling:us-east-1:089476987273:autoScalingGroup:7c41d6d8-3609-43af-8271-9e45eabd4fab:autoScalingGroupName/dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
       LaunchConfigurationName: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyLaunchConfig-SXSRJJJRQLN9',
       MinSize: 1,
       MaxSize: 1,
       DesiredCapacity: 1,
       DefaultCooldown: 300,
       AvailabilityZones: [ 'us-east-1b' ],
       LoadBalancerNames: [ 'dev-api-S-SSOProxy-JWH01RO707FY' ],
       TargetGroupARNs: [],
       HealthCheckType: 'EC2',
       HealthCheckGracePeriod: 180,
       Instances: [ { InstanceId: 'i-559deecf',
          AvailabilityZone: 'us-east-1b',
          LifecycleState: 'InService',
          HealthStatus: 'Healthy',
          LaunchConfigurationName: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyLaunchConfig-SXSRJJJRQLN9',
          ProtectedFromScaleIn: false } ],
       CreatedTime: Tue Mar 15 2016 18:58:59 GMT-0500 (CDT),
       SuspendedProcesses: [],
       VPCZoneIdentifier: 'subnet-62c27e3a',
       EnabledMetrics: [],
       Tags: [ { ResourceId: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
          ResourceType: 'auto-scaling-group',
          Key: 'Name',
          Value: 'SSO.Proxy.dev-api.msaws.sungardas.io',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:logical-id',
          Value: 'SSOProxyInstanceGroup',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:stack-id',
          Value: 'arn:aws:cloudformation:us-east-1:089476987273:stack/dev-api-SSOProxy-NRC3I0LWC47X/ccf528c0-eb09-11e5-adeb-500c28903236',
          PropagateAtLaunch: true },
        { ResourceId: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
          ResourceType: 'auto-scaling-group',
          Key: 'aws:cloudformation:stack-name',
          Value: 'dev-api-SSOProxy-NRC3I0LWC47X',
          PropagateAtLaunch: true } ],
       TerminationPolicies: [ 'Default' ],
       NewInstancesProtectedFromScaleIn: false } ] }
  */
}

function getAutoScaling(instance) {
  var autoscaling = new AWS.AutoScaling({region: region});
  var params = {
    InstanceIds: [
      instance.InstanceId
    ],
    //MaxRecords: 0,
    //NextToken: 'STRING_VALUE'
  };
  return autoscaling.describeAutoScalingInstances(params).promise().then(function(data) {
    return data.AutoScalingInstances[0];
  });
  /*
  { ResponseMetadata: { RequestId: '563560c3-6487-11e6-9e7e-db3e1082096a' },
  AutoScalingInstances:
   [ { InstanceId: 'i-559deecf',
       AutoScalingGroupName: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyInstanceGroup-1KAWT0X8355RU',
       AvailabilityZone: 'us-east-1b',
       LifecycleState: 'InService',
       HealthStatus: 'HEALTHY',
       LaunchConfigurationName: 'dev-api-SSOProxy-NRC3I0LWC47X-SSOProxyLaunchConfig-SXSRJJJRQLN9',
       ProtectedFromScaleIn: false } ] }
  */
}

function getAWSCPUUtilizationMetricStatisticsByEC2Instance(instance) {
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
        Value: instance.InstanceId
      }
   ],
   Unit: 'Percent'
  };
  var promise = cloudWatch.getMetricStatistics(AWSCPUUtilizationMetricQuery).promise();
  return promise.then(function(data) {
    var instance_metrics = {instance: instance, metrics: null};
    //console.log(data);
    metrics = data.Datapoints.sort(function(a, b){return b.Timestamp - a.Timestamp});
    if (metrics.length > 0) {
      instance_metrics.metrics = metrics[0];
    }
    return instance_metrics;
  });
}

function sendSNSNotification(instanceMetrics) {
  var sns = new AWS.SNS({region: region});
  var params = {
    Message: JSON.stringify(instanceMetrics),
    Subject: "LowActivityEC2Instance",
    TopicArn: "arn:aws:sns:us-east-1:089476987273:LowActivityEC2Instances"
  };
  console.log(params);
  return sns.publish(params).promise();
}
