
var inherits = require('util').inherits;
var AWS = require('aws-sdk');

function AWSSecurityTokenService() {


  var me = this;

  me.findService = function(input) {
    var sts = new AWS.STS();
    return sts;
  }

  me.assumeRoles = function(input)

    //console.log(input);
    profile = input.profile;
    roles = input.roles;
    sessionName = input.sessionName;

    var self = arguments.callee;

    if (!input.roles || input.roles.length == 0) {
      return;
    }

    if (profile) {
      sts = new AWS.STS();
      params = {};
      stsPromise =  sts.getSessionToken(params);
      stsPromise.then( function(data) {
        if (err) {
          console.log(err, err.stack);
        }
        else {
          console.log("successfully created a session token");
          //console.log(data);
          var creds = new AWS.Credentials({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });
          assumeRole(creds, 0, roles, sessionName, input)
        }
      });
    }
    else {
      assumeRole(null, 0, roles, sessionName, input);
    }
  }

  function assumeRole(creds, idx, roles, sessionName, input)
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
    assumeRolePromise = sts.assumeRole(params);
    assumeRolePromise.then(function(data) {
      if (err) {
        console.log(err, err.stack);
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
        }
        else {
          assumeRole(creds, idx, roles, sessionName, input);
        }
      }
    });
  }
}
module.exports = AWSSecurityTokenService

