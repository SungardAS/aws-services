
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSSecurityTokenService() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var sts = new AWS.STS();
    return sts;
  }

  me.assumeRoles = function(input, callback) {

    console.log(input);
    profile = input.profile;
    roles = input.roles;
    sessionName = input.sessionName;

    var self = arguments.callee;
    var sts = me.preRun(self, input);

    if (!input.roles || input.roles.length == 0) {
      if (callback) callback(null, input);
      else me.succeeded(input);
      return;
    }

    if (profile) {
      sts = new AWS.STS();
      params = {};
      sts.getSessionToken(params, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          if (callback) callback(err, null);
          else me.errored(err);
        }
        else {
          console.log("successfully created a session token");
          //console.log(data);
          var creds = new AWS.Credentials({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });
          assumeRole(creds, 0, roles, sessionName, input, callback);
        }
      });
    }
    else {
      assumeRole(null, 0, roles, sessionName, input, callback);
    }
  }

  function assumeRole(creds, idx, roles, sessionName, input, callback) {
    console.log('\n');
    role = roles[idx];
    var params = {};
    if (creds)  params.credentials = creds;
    var sts = new AWS.STS(params);
    var params = {
      RoleArn: role.roleArn,
      RoleSessionName: sessionName
    }
    if (role.externalId)  params.ExternalId = role.externalId;
    sts.assumeRole(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        if (callback) callback(err, null);
        else me.errored(err);
      }
      else {
        console.log("successfully assumed role, '" + role.roleArn + "'");
        //console.log(data);
        creds = new AWS.Credentials({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        });
        if (++idx == roles.length) {
          console.log("\nsuccessfully completed to assume all roles");
          input.creds = creds;
          if (callback) callback(null, input);
          else me.succeeded(input);
        }
        else {
          assumeRole(creds, idx, roles, sessionName, input, callback);
        }
      }
    });
  }
}

module.exports = AWSSecurityTokenService
