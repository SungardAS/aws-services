
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSS3Bucket() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3(params);
    return s3;
  }

  me.findBucket = function(input, callback) {

    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.listBuckets(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      var buckets = data.Buckets.filter(function(bucket) {
        return bucket.Name == input.bucketName;
      });
      //console.log(buckets);
      if (buckets[0]) {
        console.log("found a bucket");
        console.log(buckets[0]);
        return buckets[0];
      }
      else {
        console.log("bucket '" + input.bucketName + "' not found");
        return null;
       }
    }

    var s3 = me.preRun(self, input);
    s3.listBuckets(me.callbackFind);
  }
  // { Buckets:
  //     [ { Name: '290093585298.alextest1',
  //         CreationDate: Wed Jul 08 2015 10:41:42 GMT-0400 (EDT) },
  //       {  } ],
  //    Owner:
  //     { DisplayName: 'AS.US.AWScto+sasi12',
  //       ID: 'a2199891147e2e5908faf16dc092ba87bc022402976a5afc30449f1ab9835593' }
  //  }

  me.createBucket = function(input, callback) {

    params = {Bucket: input.bucketName};
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.createBucket(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.createBucket(params, me.callback);
  }
  // { Location: '/290093585298.awsconfig' }

  me.findObject = function(input, callback) {

    var params = {
      Bucket: input.bucketName,
      Key: input.keyName
      /*IfMatch: 'STRING_VALUE',
      IfModifiedSince: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
      IfNoneMatch: 'STRING_VALUE',
      IfUnmodifiedSince: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
      Range: 'STRING_VALUE',
      RequestPayer: 'requester',
      ResponseCacheControl: 'STRING_VALUE',
      ResponseContentDisposition: 'STRING_VALUE',
      ResponseContentEncoding: 'STRING_VALUE',
      ResponseContentLanguage: 'STRING_VALUE',
      ResponseContentType: 'STRING_VALUE',
      ResponseExpires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
      SSECustomerAlgorithm: 'STRING_VALUE',
      SSECustomerKey: new Buffer('...') || 'STRING_VALUE',
      SSECustomerKeyMD5: 'STRING_VALUE',
      VersionId: 'STRING_VALUE'*/
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.getObject(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.getObject(params, me.callbackFindOne);
  }

  me.listObjects = function(input, callback) {

    var params = {
      Bucket: input.bucketName,
      /*Delimiter: 'STRING_VALUE',
      EncodingType: 'url',
      Marker: 'STRING_VALUE',
      MaxKeys: 0,
      Prefix: 'STRING_VALUE'*/
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.listObjects(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.listObjects(params, me.callback);
  }

  me.putObject = function(input, callback) {

    var self = arguments.callee;
    var s3 = me.preRun(self, input);

    if (!input.sourceFolder || !input.src) {
      console.log('no change in the zip file, so just return');
      if (callback) callback(null, input);
      else me.callback(null, input);
      return;
    }

    // read a zip file
    var fs = require("fs");
    var data = '';
    if (input.zipFile) {
      data = fs.readFileSync(input.zipFile);
    }
    if (input.data) {
      data = input.data;
    }
    console.log(data);
    var params = {
      Bucket: input.bucketName,
      Key: input.keyName,
      //ACL: 'private | public-read | public-read-write | authenticated-read | bucket-owner-read | bucket-owner-full-control',
      Body: data,
      /*CacheControl: 'STRING_VALUE',
      ContentDisposition: 'STRING_VALUE',
      ContentEncoding: 'STRING_VALUE',
      ContentLanguage: 'STRING_VALUE',
      ContentLength: 0,
      ContentMD5: 'STRING_VALUE',
      ContentType: 'STRING_VALUE',
      Expires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
      GrantFullControl: 'STRING_VALUE',
      GrantRead: 'STRING_VALUE',
      GrantReadACP: 'STRING_VALUE',
      GrantWriteACP: 'STRING_VALUE',
      Metadata: {
        someKey: 'STRING_VALUE',
        * anotherKey: ... *
      },
      RequestPayer: 'requester',
      SSECustomerAlgorithm: 'STRING_VALUE',
      SSECustomerKey: new Buffer('...') || 'STRING_VALUE',
      SSECustomerKeyMD5: 'STRING_VALUE',
      SSEKMSKeyId: 'STRING_VALUE',
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD | REDUCED_REDUNDANCY',
      WebsiteRedirectLocation: 'STRING_VALUE'*/
    };

    if (callback) {
      var s3 = me.findService(input);
      s3.putObject(params, callback);
      return;
    }

    s3.putObject(params, me.callback);
  }

  me.deleteObject = function(input, callback) {

    var params = {
      Bucket: input.bucketName, /* required */
      Delete: { /* required */
        Objects: [ /* required */
          {
            Key: input.keyName, /* required */
            //VersionId: 'STRING_VALUE'
          },
          /* more items */
        ],
        Quiet: true
      },
      //MFA: 'STRING_VALUE',
      //RequestPayer: 'requester'
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.deleteObjects(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.deleteObjects(params, me.callback);
  }

  me.addPolicy = function(input, callback) {

    /*console.log("Current path = " + __dirname);
    var fs = require("fs");
    data = fs.readFileSync(__dirname + '/json/' + input.policyName + '.json', {encoding:'utf8'});
    var policyDoc = JSON.parse(data);
    for(var i = 0; i < input.resources.length; i++) {
      policyDoc.Statement[i].Resource = input.resources[i];
    }
    data = JSON.stringify(policyDoc);
    console.log(data);
    var params = {
      Bucket: input.bucketName,
      Policy: data,
      //ContentMD5: 'STRING_VALUE'
    };*/
    var params = {
      Bucket: input.bucketName,
      Policy: input.policyDocument,
      //ContentMD5: 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.putBucketPolicy(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.putBucketPolicy(params, me.callback);
  }

  me.deletePolicy = function(input, callback) {

    var params = {
      Bucket: input.bucketName,
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.deleteBucketPolicy(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.res = data;
    }

    var s3 = me.preRun(self, input);
    s3.deleteBucketPolicy(params, me.callback);
  }

  me.getPolicy = function(input, callback) {

    var params = {
      Bucket: input.bucketName /* required */
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.getBucketPolicy(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.getBucketPolicy(params, me.callback);
  }

  me.findBucketNotificationConfiguration = function(input, callback) {

    var params = {
      Bucket: input.bucketName
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.getBucketNotification(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if(data.TopicConfiguration || data.QueueConfiguration || data.CloudFunctionConfiguration) {
        console.log("found a notification config");
        console.log(data);
        return data;
      }
      else {
        console.log("notification config of the bucket '" + input.bucketName + "' not found");
        return null;
       }
    }

    var s3 = me.preRun(self, input);
    s3.getBucketNotification(params, me.callbackFind);
  }

  me.putBucketNotificationConfiguration = function(input, callback) {

    var params = {
      Bucket: input.bucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
          {
            Events: ['s3:ObjectCreated:Put'],
            LambdaFunctionArn: input.functionArn
          }
        ]
      }
    };
    console.log(JSON.stringify(params));
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.putBucketNotificationConfiguration(params, callback);
      return;
    }

    var s3 = me.preRun(self, input);
    s3.putBucketNotificationConfiguration(params, me.callback);
  }

  me.readObject = function(input, callback) {
    var params = {
      Bucket: input.bucket,
      Key: input.key
    }
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.getObject(params, function(err, data) {
        if (err)  callback(err);
        else {
          callback(null, data.Body.toString());
        }
      });
      return;
    }

    self.addParams = function(data) {
      self.params.content = data.Body.toString();
    }

    var s3 = me.preRun(self, input);
    s3.getObject(params, me.callback);
  }
}

module.exports = AWSS3Bucket
