
var AWS = require('aws-sdk');
var nameTagForUnattachedVolume = "unattached";

var main_region = "";
var federateAccount = "";
var federateRoleName = "";
var accountRoleName = "";
var sessionName = "";
var db_host = "";
var db_user = "";
var db_password = "";
var db_database = "";
var kms_key_id = "";


exports.handler = function (event, context) {

  main_region = event.region;

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data_' + event.account + '.json', {encoding:'utf8'});
  data_json = JSON.parse(data);
  federateAccount = data_json.federateAccount;
  federateRoleName = data_json.federateRoleName;
  accountRoleName = data_json.accountRoleName;
  sessionName = data_json.sessionName;
  db_host = data_json.db_host;
  db_user = data_json.db_user;
  db_password = data_json.db_password;
  db_database = data_json.db_database;
  kms_key_id = data_json.kms_key_id;

  decrypt(db_password, function(err, data) {
    if (err) {
      console.log(err);
      context.fail(err);
    }
    else {
      db_password = data;
      findAccounts(accountRoleName, function(err, accounts) {
        if (err) {
          console.log(err);
          context.fail(err);
        }
        else {
          tagVolumesInNextAccount(accounts, 0, function(err, data) {
            if (err)  context.fail(err);
            else {
              console.log("completed to tag volumnes in all accounts/regions : " + data);
              context.done(null, data);
            }
          });
        }
      });
    }
  });
}

function decrypt(password, callback) {
  if (password == "") callback(null, password);
  var params = {
    CiphertextBlob: new Buffer(password, 'base64')
  };
  var kms = new AWS.KMS({region:main_region});
  kms.decrypt(params, function(err, data) {
    if (err) {
      callback(err, null);
    }
    else {
      password = data.Plaintext.toString();
      //console.log(password);
      callback(null, password);
    }
  });
}

function encrypt(password, callback) {
  if (password == "") callback(null, password);
  var params = {
    KeyId: kms_key_id,
    Plaintext: password
  };
  var kms = new AWS.KMS({region:main_region});
  kms.encrypt(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err);
    }
    else {
      password = data.CiphertextBlob.toString('base64');
      console.log(password);
      callback(null, password);
    }
  });
}

function findAccounts(accountRoleName, callback) {

  var mysql      = require('mysql');
  var connection = mysql.createConnection({
   host     : db_host,
   user     : db_user,
   password : db_password,
   database : db_database
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
          connection.end();
          console.log("failed to get accounts : " + err);
          callback(err, null);
        }
        console.log('Successfully retrieved accounts : ' + JSON.stringify(result));
        connection.end();
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

function federate(account, federateAccount, federateRoleName, accountRoleName, accountRoleExternalId, sessionName, callback) {

  var aws_sts = new (require('../lib/aws/sts'))();

  var roles = [];
  if (federateAccount) {
    roles.push({roleArn:'arn:aws:iam::' + federateAccount + ':role/' + federateRoleName});
    var admin_role = {roleArn:account.arn};
    if (accountRoleExternalId) {
      admin_role.externalId = accountRoleExternalId;
    }
    roles.push(admin_role);
  }
  console.log(roles);

  var input = {
    sessionName: sessionName,
    roles: roles
  };

  aws_sts.assumeRoles(input, callback);
}

function tagAccountVolumes(account, callback) {
  // federate to the account
  federate(account, federateAccount, federateRoleName, account.name, account.externalId, sessionName, function(err, data) {
    if (err) {
      console.log(err);
      callback(err);
    }
    else {
      var ec2Main = new AWS.EC2({region:main_region});
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
