
var AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var kms = new AWS.KMS(params);
    return kms;
  },

  decrypt: function(input) {
    var kms = this.findService(input);
    var params = {
      CiphertextBlob: new Buffer(input.password, 'base64')
    };
    return kms.decrypt(params).promise();
  }
}
