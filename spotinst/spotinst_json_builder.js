
var defaultScaling = {
  "up":  [
    {
      "metricName": "CPUUtilization",
      "statistic": "average",
      "unit": "percent",
      "threshold": 90,
      "namespace": "AWS/EC2",
      "dimensions": [
        {
          "name": "InstanceId"
        }
      ],
      "period": 300,
      "evaluationPeriods": 1,
      "cooldown": 300,
      "action": {
        "type": "percentageAdjustment",
        "adjustment": 20
      },
      "operator": "gte"
    }
  ],
  "down": [
    {
      "metricName": "CPUUtilization",
      "statistic": "average",
      "unit": "percent",
      "threshold": 10,
      "namespace": "AWS/EC2",
      "dimensions": [
        {
          "name": "InstanceId"
        }
      ],
      "period": 300,
      "evaluationPeriods": 1,
      "cooldown": 300,
      "action": {
        "type": "updateCapacity",
        "target": 10,
        "minimum": 5,
        "maximum": 20
      },
      "operator": "lte"
    },
    {
      "metricName": "overhead",
      "statistic": "average",
      "unit": "milliseconds",
      "threshold": 0.8,
      "namespace": "Monitoring",
      "dimensions": [
        {
          "name": "Cluster",
          "value": "M2M"
        },
        {
          "name": "Environment",
          "value": "ia-staging"
        }
      ],
      "period": 300,
      "evaluationPeriods": 1,
      "cooldown": 300,
      "action": {
        "type": "adjustment",
        "adjustment": 1
      },
      "operator": "lt"
    }
  ]
};
var defaultScheduling = {
  "tasks": [
    {
      "frequency": "hourly",
      "taskType": "backup_ami"
    },
    {
       "taskType": "roll",
       "cronExpression": "00 17 * * 3",
       "batchSizePercentage": 30
    },
    {
       "taskType": "scale",
       "cronExpression": "00 22 * * 3",
       "scaleTargetCapcity": 0,
       "scaleMinCapcity": 0,
       "scaleMaxCapcity": 3
    }
  ]
};

module.exports = {

  build: function(instance, name, description, keyPairName, tags) {

    var group = {
      "name": name,
      "description": description
    };

    var capacity = {
      "target": 1,
      "minimum": 1,
      "maximum": 1,
      "unit": "instance"
    };

    var strategy = {
      "risk": 100,
      "onDemandCount": null,
      "drainingTimeout": 0,
      "availabilityVsCost": "balanced",
      "fallbackToOd": true,
      "utilizeReservedInstances": false
    };

    var compute = {
      "instanceTypes": {
        "ondemand": instance.InstanceType,
        "spot": [
          "c3.large",
          "c4.large",
          "m3.large",
          "r3.large"
        ]
      },
      /*"availabilityZones": [
        {
          "name": instance.Placement.AvailabilityZone,
          "subnetId": instance.SubnetId
        }
      ],*/
      "availabilityZones": instance.Subnets.map(function(subnet) { return { name: subnet.AvailabilityZone, subnetId: subnet.SubnetId}; }),
      "product": instance.Platform == "Windows" ? "Windows" : "Linux/UNIX",
      /*"elasticIps" : [],*/
      "launchSpecification": {
        "loadBalancerNames": (instance.AutoScalingGroups.length > 0) ? instance.AutoScalingGroups.map(function(group) { return group.LoadBalancerNames[0]; }): null,
        "healthCheckType": (instance.AutoScalingGroups.length > 0) ? "ELB": null,
        "healthCheckGracePeriod": (instance.AutoScalingGroups.length > 0) ? instance.AutoScalingGroups[0].HealthCheckGracePeriod: null,
        "securityGroupIds": instance.SecurityGroups.map(function(sg) { return sg.GroupId; }),
        "monitoring": (instance.Monitoring.State == "enabled"),
        "imageId": instance.ImageId,
        //"keyPair": (instance.KeyName) ? instance.KeyName: null,
        "keyPair": keyPairName,
        ///"iamRole" : {"name": instance.IamInstanceProfile.Arn.split('/')[instance.IamInstanceProfile.Arn.split('/').length-1]},
        "iamRole" : {"arn": instance.IamInstanceProfile.Arn},
        /*"blockDeviceMappings": [
          {
            "deviceName": "/dev/sdm",
            "ebs": {
              "deleteOnTermination": "true",
              "volumeSize": "80",
              "volumeType": "gp2"
            }
          },
          {
            "deviceName": "/dev/sda1",
            "ebs": {
              "deleteOnTermination": "true",
              "volumeSize": "24",
              "volumeType": "gp2"
            },
            { // For ephemeral storage
              "deviceName": "/dev/xvdb",
              "virtualName": "ephemeral0"
            },
            {
              "deviceName": "/dev/xvdc",
              "virtualName": "ephemeral1"
            }
          }
        ],*/
        "userData": instance.UserData,
        //"tags": instance.Tags.map(function(tag) { return {tagKey: tag.Key.replace('aws:', ''), tagValue: tag.Value}; }),
        "tags": tags.map(function(tag) { return {tagKey: tag.Key, tagValue: tag.Value}; }),
        "networkInterfaces": instance.NetworkInterfaces.map(function(interface) {
            return {
              deviceIndex: interface.Attachment.DeviceIndex,
              associatePublicIpAddress: (interface.Association && interface.Association.PublicIp) ? true: false,
              deleteOnTermination: interface.Attachment.DeleteOnTermination
            };
          })
      },
      /*"ebsVolumePool": [
        {
          "deviceName": "",
          "volumeIds": []
        },
        {
          "deviceName": "",
          "volumeIds": []
        }
      ]*/
      /*"networkInterfaces": [
        {
          "deviceIndex": 0,
          "associatePublicIpAddress": false,
          "deleteOnTermination": true
        }
      ]*/
    };

    // compute.launchSpecification.blockDeviceMappings
    var rootVolume = instance.BlockDeviceMappings.find(function(dev) { return dev.DeviceName == instance.RootDeviceName; });
    compute.launchSpecification.blockDeviceMappings = instance.Volumes.filter(function(volume) {
        return volume.VolumeId == rootVolume.Ebs.VolumeId;
      }).map(function(volume) {
        return {
          deviceName: rootVolume.DeviceName,
          ebs: { deleteOnTermination: rootVolume.Ebs.DeleteOnTermination, volumeSize: volume.Size, volumeType: volume.VolumeType }
        };
      });

    // compute.ebsVolumePool
    compute.ebsVolumePool = instance.BlockDeviceMappings.filter(function(dev) {
        return dev.DeviceName != instance.RootDeviceName;
      }).map(function(dev) {
        return {
          deviceName: dev.DeviceName,
          volumeIds: [ dev.Ebs.VolumeId ]
        };
      });

    var spotInstJSON = {};
    spotInstJSON.group = group;
    spotInstJSON.group.capacity = capacity;
    spotInstJSON.group.strategy = strategy;
    spotInstJSON.group.compute = compute;
    spotInstJSON.group.scaling = { up: null, down: null };
    spotInstJSON.group.scheduling = {tasks: null};

    //console.log(JSON.stringify(spotInstJSON));
    return spotInstJSON;
  },

  deploy: function(spotInstJSON, accessKey) {

    // curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer d04821bde138802e17d3b4cbda1283b2193f79e419341bfb3b51073d9187185f" -d @json/i-79dea6e4-dbaccessor.json https://api.spotinst.io/aws/ec2/group

    var rp = require('request-promise');
    var options = {
      method: 'POST',
      uri: 'https://api.spotinst.io/aws/ec2/group',
      body: spotInstJSON,
      headers: {
        "content-type": "application/json",
        "Authorization": "Bearer " + accessKey
      },
      json: true // Automatically stringifies the body to JSON
    };

    return rp(options).then(function (parsedBody) {
      console.log(parsedBody);
      return parsedBody;
    });
  }
}

/*
var rp = require('request-promise');
var options = {
  method: 'POST',
  uri: 'https://t9d2i86pud.execute-api.us-east-1.amazonaws.com/v1/cloudtrail',
  body: {
    "federateAccount": "089476987273",
    "account": "089476987273",
    "federateRoleName": "federate",
    "roleName": "sgas_dev_admin",
    "sessionName": "abcde",
    "region": "ap-south-1"
  },
  headers: {
    "content-type": "application/json",
    "roleExternalId": "88df904d-c597-40ef-8b29-b767aba1eaa4"
  },
  json: true // Automatically stringifies the body to JSON
};

rp(options).then(function (parsedBody) {
  console.log(parsedBody);
}).catch(function (err) {
  console.log(err);
});
*/
