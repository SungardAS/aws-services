
var AWS = require('aws-sdk');

function S3Configuration() {

  var me = this;

  me.deploy = function(input, callback) {
    me.getPolicy(input, callback);
  }

  me.findBucketNotificationConfiguration = function(input, callback) {
    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var s3 = new AWS.S3(params);
    params = {
      Bucket: input.bucketName
    };
    console.log(params);
    s3.getBucketNotification(params, function(err, data) {
      if (err)  callback(err, null);
      else {
        if(data.TopicConfiguration || data.QueueConfiguration || data.CloudFunctionConfiguration) {
          console.log("found a notification config");
          console.log(data);
          callback(null, true);
        }
        else {
          console.log("notification config of the bucket '" + input.bucketName + "' not found");
          me.putBucketNotificationConfiguration(input, callback);
        }
      }
    });
  }

  me.putBucketNotificationConfiguration = function(input, callback) {
    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var s3 = new AWS.S3(params);
    params = {
      Bucket: input.bucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
          {
            //Events: ['s3:ObjectCreated:Put'],
            Events: input.events,
            LambdaFunctionArn: input.functionArn
          }
        ]
      }
    };
    console.log(JSON.stringify(params));
    s3.putBucketNotificationConfiguration(params, callback);
  }

  me.clean = function(input, callback) {
    callback(null, true);
  }

  me.build = function(action, packageJSON, roleArn, callback) {
    var input = {
      region: packageJSON.region,
      bucketName: packageJSON.bucketName,
      functionArn: packageJSON.functionArn,
      events: packageJSON.events,
      creds: packageJSON.creds
    };
    console.log(input);
    me[action](input, callback);
  }
}

module.exports = S3Configuration
