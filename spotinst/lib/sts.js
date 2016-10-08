
var AWS = require('aws-sdk');

module.exports = {

  findService: function(creds, profile) {
    var params = {};
    if (creds)  params.credentials = creds;
    else if (profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: profile});
      AWS.config.credentials = credentials;
    }
    var sts = new AWS.STS(params);
    return sts;
  },

  assumeRole: function(federateRoleArn, accountRoleArn, externalId, creds, profile) {
    if (!federateRoleArn) return new Promise(function(resolve, reject) {
      resolve(null);
    });
    var sts = this.findService(creds, profile);
    var params = {
      RoleArn: federateRoleArn,
      RoleSessionName: 'session'
    };
    return sts.assumeRole(params).promise().then(function(data) {
      console.log(data);
      var creds = new AWS.Credentials({
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken
      });
      sts = new AWS.STS({credentials: creds});
      params = {
        RoleArn: accountRoleArn,
        ExternalId: externalId,
        RoleSessionName: 'session'
      };
      return sts.assumeRole(params).promise().then(function(data) {
        console.log(data);
        creds = new AWS.Credentials({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        });
        return creds;
      });
    });
  }
}
