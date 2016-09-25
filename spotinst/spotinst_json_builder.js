
var _ = require('lodash');

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

  buildJSON: function(instance, name, description, capacityTarget, capacityMin, capacityMax, spotTypes, iamRoleArn, keyPairName, tags) {

    var group = {
      "name": name,
      "description": description
    };

    var capacity = {
      "target": capacityTarget,
      "minimum": capacityMin,
      "maximum": capacityMax,
      "unit": "instance"
    };

    var strategy = {
      "risk": 100,
      "onDemandCount": 0,
      "drainingTimeout": 0,
      "availabilityVsCost": "balanced",
      "fallbackToOd": true,
      "utilizeReservedInstances": false
    };

    var compute = {
      "instanceTypes": {
        "ondemand": instance.InstanceType,
        "spot": (typeof(spotTypes) == 'string') ? spotTypes.split(','): spotTypes,
      },
      /*"availabilityZones": [
        {
          "name": instance.Placement.AvailabilityZone,
          "subnetId": instance.SubnetId
        }
      ],*/
      "availabilityZones": instance.Subnets.map(function(subnet) { return { name: subnet.AvailabilityZone, subnetId: subnet.SubnetId}; }),
      "product": instance.Platform == "Windows" ? "Windows" : "Linux/UNIX",
      //"elasticIps" : [],
      "launchSpecification": {
        "loadBalancerNames": (instance.AutoScalingGroups.length > 0) ? _.flatten(instance.AutoScalingGroups.map(function(group) { return group.LoadBalancerNames })): null,
        "healthCheckType": (instance.AutoScalingGroups.length > 0) ? "ELB": null,
        "healthCheckGracePeriod": (instance.AutoScalingGroups.length > 0) ? instance.AutoScalingGroups[0].HealthCheckGracePeriod: null,
        "securityGroupIds": instance.SecurityGroups.map(function(sg) { return sg.GroupId; }),
        "monitoring": (instance.Monitoring.State == "enabled"),
        "imageId": instance.ImageId,
        //"keyPair": (instance.KeyName) ? instance.KeyName: null,
        "keyPair": keyPairName,
        "iamRole" : (iamRoleArn) ? {"arn": iamRoleArn}: ((instance.IamInstanceProfile) ? {"arn": instance.IamInstanceProfile.Arn}: ""),
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
        "tags": (typeof(tags) == 'string') ? [{tagKey: 'Name', tagValue: tags}] : tags.map(function(tag) { return {tagKey: tag.Key, tagValue: tag.Value}; }),
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

    // remove attributes whose value is null
    if (!compute.launchSpecification.loadBalancerNames) delete compute.launchSpecification.loadBalancerNames;
    if (!compute.launchSpecification.healthCheckType) delete compute.launchSpecification.healthCheckType;
    if (!compute.launchSpecification.healthCheckGracePeriod) delete compute.launchSpecification.healthCheckGracePeriod;

    // The associatePublicIPAddress parameter cannot be specified when launching with multiple network interfaces.
    if (compute.launchSpecification.networkInterfaces.length > 1) {
      compute.launchSpecification.networkInterfaces.map(networkInterface => delete networkInterface.associatePublicIpAddress)
    }

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

  build: function(instance, name, description, keyPairName, tags) {
    var capacityTarget = 1;
    var capacityMin = 1;
    var capacityMax = 1;
    var spotTypes = "c3.large,c4.large,m3.large,r3.large";
    return this.buildJSON(instance, name, description, capacityTarget, capacityMin, capacityMax, spotTypes, null, keyPairName, tags);
  },

  buildCF: function(accessKey, instance, name, description, keyPairName, nameTag, templateFilePath) {
    var cf_name = {"Ref": "ElastiGroupName"};
    var cf_description = {"Ref": "ElastiGroupDescription"};
    var cf_capacityTarget = {"Ref": "CapacityTarget"};
    var cf_capacityMin = {"Ref": "CapacityMin"};
    var cf_capacityMax = {"Ref": "CapacityMax"};
    var cf_spotTypes = {"Ref": "ComputeSpotInstanceTypes"};
    var cf_iamRoleArn = {"Ref": "IAMRoleArn"};
    var cf_keyPairName = {"Ref": "KeypairName"};
    var json = this.buildJSON(instance, cf_name, cf_description, cf_capacityTarget, cf_capacityMin, cf_capacityMax, cf_spotTypes, cf_iamRoleArn, cf_keyPairName, nameTag);
    //console.log(JSON.stringify(json));

    // remove 'scaling' and 'scheduling'
    delete json.group.scaling;
    delete json.group.scheduling;

    var fs = require("fs");
    var cf = JSON.parse(fs.readFileSync(templateFilePath));
    cf.Parameters.AccessKey.Default = accessKey;
    cf.Parameters.ElastiGroupName.Default = name;
    cf.Parameters.ElastiGroupDescription.Default = description;
    cf.Parameters.KeypairName.Default = keyPairName;
    cf.Parameters.IAMRoleArn.Default = (instance.IamInstanceProfile) ? instance.IamInstanceProfile.Arn: "";
    cf.Parameters.NameTag.Default = nameTag;
    cf.Resources.SpotinstElastigroup.Properties.group = json.group;
    //console.log(JSON.stringify(cf, null, 2));

    return cf;
  },

  deploy: function(spotInstJSON, accessKey) {

    // curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <access_key>" -d @json/i-79dea6e4-dbaccessor.json https://api.spotinst.io/aws/ec2/group

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
  },
}
