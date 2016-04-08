
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSKeyManagement() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region: input.key.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var kms = new AWS.KMS(params);
    return kms;
  }

  me.createKey = function(input, callback) {

    var params = {
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var kms = me.findService(input);
      kms.createKey(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.key.keyId = data.KeyMetadata.KeyId;
    }

    var kms = me.preRun(self, input);
    kms.createKey(params, me.callback);
  }
  /*
  { KeyMetadata:
    { AWSAccountId: '745968232654',
      KeyId: '001fa87d-3526-4e78-b12d-ec9ba4aa65e5',
      Arn: 'arn:aws:kms:us-east-1:745968232654:key/001fa87d-3526-4e78-b12d-ec9ba4aa65e5',
      CreationDate: Fri Apr 01 2016 10:42:28 GMT-0500 (CDT),
      Enabled: true,
      Description: '',
      KeyUsage: 'ENCRYPT_DECRYPT',
      KeyState: 'Enabled'
    }
  }
*/

  me.encrypt = function(input, callback) {

    var params = {
      KeyId: input.key.keyId,
      Plaintext: input.strToEncrypt
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var kms = me.findService(input);
      kms.encrypt(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.encryptedStr = data.CiphertextBlob.toString('base64');
    }

    var kms = me.preRun(self, input);
    kms.encrypt(params, me.callback);
  }

  me.decrypt = function(input, callback) {

    var params = {
      CiphertextBlob: new Buffer(input.encryptedStr, 'base64')
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var kms = me.findService(input);
      kms.decrypt(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.decryptedStr = data.Plaintext.toString();
    }

    var kms = me.preRun(self, input);
    kms.decrypt(params, me.callback);
  }
}

module.exports = AWSKeyManagement
