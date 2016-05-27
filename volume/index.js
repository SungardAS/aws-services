
var AWS = require('aws-sdk');
var ec2Main = new AWS.EC2({region:'us-east-1'});
var nameTagForUnattachedVolume = "unattached";

exports.handler = function (event, context) {
  ec2Main.describeRegions({}).promise().then(function(data) {
    //console.log(data);
    return Promise.all(data.Regions.map(function(region) {
      return tagVolumes(region.RegionName).then(function(data) {
        console.log("result of region " + region.RegionName + " : " + data);
        var ret = {};
        ret[region.RegionName] = data;
        return ret;
      });
    })).then(function(data) {
      console.log(data);
      context.done(null, data);
    });
  }).catch(function(err) {
    console.log(err);
    context.fail(err);
  });
}

function findNameTag(tags) {
  if (tags == null) return null;
  for (var idx = 0; idx < tags.length; idx++) {
    if (tags[idx].Key == 'Name')  return tags[idx].Value;
  }
  return null;
}

function tagVolumes(region) {
  var ec2 = new AWS.EC2({region:region});
  var params = {};
  return ec2.describeVolumes(params).promise().then(function(data) {
    console.log('There are ' + data.Volumes.length + ' volume(s) in region ' + region);
    return Promise.all(data.Volumes.map(function(volume) {
      var volumeNameTag = findNameTag(volume.Tags);
      if (volume.State == 'in-use') {
        params = {
          InstanceIds: [volume.Attachments[0].InstanceId]
        };
        return ec2.describeInstances(params).promise().then(function(data) {
          //console.log(JSON.stringify(reservation));
          //console.log(data.Reservations.length);
          var instance = data.Reservations[0].Instances[0];
          //console.log(instance.Tags);
          // [ { Key: 'Name', Value: 'mail server' } ]
          var instanceNameTag = findNameTag(instance.Tags);
          var newVolumeNameTag = null;
          if (!instanceNameTag) {
            newVolumeNameTag = instance.InstanceId;
          }
          else {
            newVolumeNameTag = instanceNameTag;
          }
          return [volume.VolumeId, volumeNameTag, newVolumeNameTag];
        });
      }
      else {
        return [volume.VolumeId, volumeNameTag, nameTagForUnattachedVolume];
      }
    }));
  }).then(function(data) {
    //console.log(data);
    return Promise.all(data.map(function(tag) {
      if (tag[1] != tag[2]) {
        var params = {
          Resources: [ tag[0] ],
          Tags: [
            {
              Key: 'Name',
              Value: tag[2]
            },
          ]
        };
        console.log("creating tags : " + tag + " in region " + region);
        return ec2.createTags(params).promise().then(function(ret) {
          //console.log(ret);
          if(tag[1])  return "Updated";
          else return "Created";
        });
      }
      else {
        return "NoChange";
      }
    }));
  });
}

/*
  {
    "VolumeId":"vol-858f6b27",
    "Size":8,
    "SnapshotId":"snap-e1c389ac",
    "AvailabilityZone":"us-east-1b",
    "State":"in-use",
    "CreateTime":"2016-03-15T23:59:03.469Z",
    "Attachments":[
      {
        "VolumeId":"vol-858f6b27",
        "InstanceId":"i-afce1134",
        "Device":"/dev/xvda",
        "State":"attached",
        "AttachTime":"2016-03-15T23:59:03.000Z",
        "DeleteOnTermination":true
      }
    ],
    "Tags":[],
    "VolumeType":"standard",
    "Encrypted":false
  }
*/

//{"ReservationId":"r-12c29ec0","OwnerId":"089476987273","Groups":[],"Instances":[{"InstanceId":"i-cf1b184b","ImageId":"ami-05355a6c","State":{"Code":16,"Name":"running"},"PrivateDnsName":"ip-10-0-1-145.ec2.internal","PublicDnsName":"ec2-54-88-1-81.compute-1.amazonaws.com","StateTransitionReason":"","AmiLaunchIndex":0,"ProductCodes":[],"InstanceType":"t1.micro","LaunchTime":"2016-03-31T03:30:45.000Z","Placement":{"AvailabilityZone":"us-east-1a","GroupName":"","Tenancy":"default"},"KernelId":"aki-88aa75e1","Monitoring":{"State":"disabled"},"SubnetId":"subnet-31c47847","VpcId":"vpc-b8266edc","PrivateIpAddress":"10.0.1.145","PublicIpAddress":"54.88.1.81","Architecture":"x86_64","RootDeviceType":"ebs","RootDeviceName":"/dev/sda1","BlockDeviceMappings":[{"DeviceName":"/dev/sda1","Ebs":{"VolumeId":"vol-cbe64f63","Status":"attached","AttachTime":"2016-03-31T03:30:46.000Z","DeleteOnTermination":true}}],"VirtualizationType":"paravirtual","ClientToken":"4921afd938254e0d2f7e42f191b0d7e7","Tags":[],"SecurityGroups":[{"GroupName":"dev-api-AppStack-1LJ0B53SUJFWM-AppSecurityGroup-1OI8F8TKPGFIE","GroupId":"sg-0de9fc74"}],"SourceDestCheck":true,"Hypervisor":"xen","NetworkInterfaces":[{"NetworkInterfaceId":"eni-499cdd08","SubnetId":"subnet-31c47847","VpcId":"vpc-b8266edc","Description":"","OwnerId":"089476987273","Status":"in-use","MacAddress":"0a:34:87:9d:19:a7","PrivateIpAddress":"10.0.1.145","PrivateDnsName":"ip-10-0-1-145.ec2.internal","SourceDestCheck":true,"Groups":[{"GroupName":"dev-api-AppStack-1LJ0B53SUJFWM-AppSecurityGroup-1OI8F8TKPGFIE","GroupId":"sg-0de9fc74"}],"Attachment":{"AttachmentId":"eni-attach-de453c24","DeviceIndex":0,"Status":"attached","AttachTime":"2016-03-31T03:30:45.000Z","DeleteOnTermination":true},"Association":{"PublicIp":"54.88.1.81","PublicDnsName":"ec2-54-88-1-81.compute-1.amazonaws.com","IpOwnerId":"amazon"},"PrivateIpAddresses":[{"PrivateIpAddress":"10.0.1.145","PrivateDnsName":"ip-10-0-1-145.ec2.internal","Primary":true,"Association":{"PublicIp":"54.88.1.81","PublicDnsName":"ec2-54-88-1-81.compute-1.amazonaws.com","IpOwnerId":"amazon"}}]}],"IamInstanceProfile":{"Arn":"arn:aws:iam::089476987273:instance-profile/DataPipelineDefaultResourceRole","Id":"AIPAJOO54ZOZEEYHNZWII"},"EbsOptimized":false}]}
