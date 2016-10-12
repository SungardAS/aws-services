
var AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    var params = {};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var sts = new AWS.STS(params);
    return sts;
  },

  assumeRole: function(input) {
    if (!input.federateRoleArn) return new Promise(function(resolve, reject) {
      resolve(null);
    });
    var sts = this.findService(input);
    var params = {
      RoleArn: input.federateRoleArn,
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
        RoleArn: input.accountRoleArn,
        ExternalId: input.externalId,
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
