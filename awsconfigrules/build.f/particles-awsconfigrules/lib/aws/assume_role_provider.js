
var AWS = require('aws-sdk');

function AssumeRoleProvider() {

  this.expiration = null;

  var me = this;

  me.isAlmostExpired = function() {
    console.log("expiration[" + new Date(me.expiration) + "], now[" + new Date() + "]");
    //console.log(me.expiration - (new Date().getTime()));
    return me.expiration <= (new Date().getTime() + 5*60*1000);
  }

  me.getCredential = function(roles, sessionName, durationSeconds, profile, callback) {
    if (!roles || roles.length == 0) {
      callback(null, true);
      return;
    }
    if (profile) {
      sts = new AWS.STS();
      params = {};
      sts.getSessionToken(params, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          callback(err, null);
        }
        else {
          console.log("successfully created a session token");
          //console.log(data);
          var creds = new AWS.Credentials({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });
          assumeRole(creds, 0, roles, sessionName, durationSeconds, function(err, data) {
            callback(err, data);
          });
        }
      });
    }
    else {
      assumeRole(null, 0, roles, sessionName, durationSeconds, function(err, data) {
        callback(err, data);
      });
    }
  }

  function assumeRole(creds, idx, roles, sessionName, durationSeconds, callback) {
    role = roles[idx];
    var params = {};
    if (creds)  params.credentials = creds;
    var sts = new AWS.STS(params);
    var params = {
      RoleArn: role.roleArn,
      RoleSessionName: sessionName,
    }
    if (durationSeconds > 0)  params.DurationSeconds = durationSeconds;
    if (role.externalId)  params.ExternalId = role.externalId;
    sts.assumeRole(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err, null);
      }
      else {
        console.log("successfully assumed role, '" + role.roleArn + "'");
        //console.log(data);
        if (++idx == roles.length) {
          console.log("successfully completed to assume all roles");
          me.expiration = Date.parse(data.Credentials.Expiration);
          creds = new AWS.Credentials({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });
          callback(null, creds);
        }
        else {
          creds = new AWS.Credentials({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });
          assumeRole(creds, idx, roles, sessionName, durationSeconds, callback);
        }
      }
    });
  }
}

module.exports = AssumeRoleProvider
