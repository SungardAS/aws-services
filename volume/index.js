
var AWS = require('aws-sdk');
var ec2Main = new AWS.EC2({region:'us-east-1'});
var nameTagForUnattachedVolume = "unattached";

exports.handler = function (event, context) {
  ec2Main.describeRegions({}).promise().then(function(data) {
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
          var instance = data.Reservations[0].Instances[0];
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
