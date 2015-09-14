
var rsaSign = require('jsrsasign');
var request = require('request');

function validate(snsMessage, callback) {
  var messageStr = "";
  if (snsMessage.Type == 'Notification') {
    messageStr = notificationMessageToStr(snsMessage);
  }
  else if (snsMessage.Type == 'SubscriptionConfirmation' || snsMessage.Type == 'UnsubscribeConfirmation'){
    messageStr = subscriptionMessageToStr(snsMessage);
  }
  else {
    callback('Invalid message type : ' + snsMessage.Type);
    return;
  }
  request(snsMessage.SigningCertURL, function (error, response, body) {
      if(error){
          callback(error);
          return;
      }
      if(response.statusCode !== 200){
          callback('Invalid status code returned during getting signing cert file : ' + response.statusCode);
          return;
      }
      var pem_str = body.toString();
      var sig = new rsaSign.crypto.Signature({"alg": "SHA1withRSA", "prov": "cryptojs/jsrsa"});
      sig.initVerifyByCertificatePEM(pem_str);
      sig.updateString(messageStr);
      var buf = new Buffer(snsMessage.Signature, 'base64');
      var res = sig.verify(buf.toString('hex'));
      return callback(null, res);
  });
}

function notificationMessageToStr(snsMessage) {
  var str = "";
  str += "Message\n" + snsMessage.Message + '\n';
  str += "MessageId\n" + snsMessage.MessageId + '\n';
  str += "Subject\n" + snsMessage.Subject + '\n';
  str += "Timestamp\n" + snsMessage.Timestamp + '\n';
  str += "TopicArn\n" + snsMessage.TopicArn + '\n';
  str += "Type\n" + snsMessage.Type + '\n';
  return str;
}

function subscriptionMessageToStr(snsMessage) {
  var str = "";
  str += "Message\n" + snsMessage.Message + '\n';
  str += "MessageId\n" + snsMessage.MessageId + '\n';
  str += "SubscribeURL\n" + snsMessage.SubscribeURL + '\n';
  str += "Timestamp\n" + snsMessage.Timestamp + '\n';
  str += "Token\n" + snsMessage.Token + '\n';
  str += "TopicArn\n" + snsMessage.TopicArn + '\n';
  str += "Type\n" + snsMessage.Type + '\n';
  return str;
}

exports.validate = validate;
