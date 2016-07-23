
var AWS = require('aws-sdk');
var ec2Main = new AWS.EC2({region:'us-east-1'});
var nameTagForUnattachedVolume = "unattached";

exports.handler = function (event, context) {

  var accounts = [];




  tagVolumesInNextAccount(accounts, 0, function(err, data) {
    if (err)  context.fail(err);
    else context.done(null, data);
  })
}

function findAccounts(accountRoleName, callback) {



  var host = '127.0.0.1'
  //var host = 'dd76vhvkzmqyxv.crht7yd5fqrx.us-east-1.rds.amazonaws.com'
  var user = 'msaws'
  var password = ''
  var database = 'msaws'

  var mysql      = require('mysql');
  var connection = mysql.createConnection({
   host     : host,
   user     : user,
   password : password,
   database : database
  });

  console.log("connecting to database");
  connection.connect(function(err) {
    if (err) {
     console.error('error connecting: ' + err.stack);
     callback(err, null);
    }
    else {
      console.log('connected as id ' + connection.threadId);
      var query = connection.query("SELECT * FROM awsiamrole WHERE name = '" + accountRoleName + "'", function(err, result) {
        if (err) {
          //connection.end();
          console.log("failed to get accounts : " + err);
          callback(err, null);
        }
        console.log('Successfully retrieved accounts : ' + result);
        //connection.end();
        callback(null, result);
      });
    }
  });
}

function tagVolumesInNextAccount(accounts, idx, callback) {
  var account = accounts[idx];
  tagAccountVolumes(account, function(err, data) {
    if (err) {
      console.log("Failed tag volumes in account[" + account + "]");
      callback(err);
    }
    else {
      console.log("Successfully tagged volumes in account[" + account + "]");
      console.log(data);
      if (++idx == accounts.length) {
        callback(null, true);
      }
      else {
        tagVolumesInNextAccount(accounts, idx, callback);
      }
    }
  });
}

function federate(account, federateAccount, federateRoleName, accountRoleName, callback) {

  var aws_sts = new (require('../lib/aws/sts'))();
  var aws_config = new (require('../lib/aws/awsconfig.js'))();

  if (!federateRoleName)  federateRoleName = "federate";
  if (!accountRoleName)  accountRoleName = "sgas_admin";

  var roles = [];
  if (federateAccount) {
    roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/' + federateRoleName});
    var admin_role = {roleArn:'arn:aws:iam::' + account + ':role/' + accountRoleName};
    if (event.roleExternalId) {
      admin_role.externalId = event.roleExternalId;
    }
    roles.push(admin_role);
  }
  console.log(roles);

  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }

  var input = {
    sessionName: sessionName,
    roles: roles,
    region: event.region
  };

}


function tagAccountVolumes(account, callback) {

  // federate to the account




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
      callback(null, data);
    });
  }).catch(function(err) {
    console.log(err);
    callback(err);
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
