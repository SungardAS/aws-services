
function AWSS3Bucket() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findBucket = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3();
    s3.listBuckets(function(err, data) {
      if (err) {
        console.log("Error in listBuckets : " + err, err.stack);
        fc.run_error_function(me.findBucket, err);
      }
      else {
        console.log(data);
        var buckets = data.Buckets.filter(function(bucket) {
          return bucket.Name == input.bucketName;
        });
        console.log(buckets);
        if (buckets[0]) {
          console.log("found a bucket");
          console.log(buckets[0]);
          fc.run_success_function(me.findBucket, input);
        }
        else {
          console.log("bucket '" + input.bucketName + "' not found");
          fc.run_failure_function(me.findBucket, input);
         }
      }
    });
    // { Buckets:
    //     [ { Name: '290093585298.alextest1',
    //         CreationDate: Wed Jul 08 2015 10:41:42 GMT-0400 (EDT) },
    //       {  } ],
    //    Owner:
    //     { DisplayName: 'AS.US.AWScto+sasi12',
    //       ID: 'a2199891147e2e5908faf16dc092ba87bc022402976a5afc30449f1ab9835593' }
    //  }
  }

  me.createBucket = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3();
    params = {Bucket: input.bucketName};
    s3.createBucket(params, function(err, data) {
      if (err) {
        console.log("Error in createBucket : " + err, err.stack);
        fc.run_error_function(me.createBucket, err);
      }
      else {
        console.log(data);
        console.log("successfully created a bucket : " + data.Location);
        fc.run_success_function(me.createBucket, input);
      }
    });
    // { Location: '/290093585298.awsconfig' }
  }

  me.findObject = function(input) {
    //var input.keyName = 'niktest/AWSLogs/054649790173/Config/ConfigWritabilityCheckFile';
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3();
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
    s3.getObject(params, function(err, data) {
      if (err) {
        // console.log("Error in getObject : " + err, err.stack);
        console.log("object '" + input.keyName + "' not found");
        fc.run_failure_function(me.findObject, input);
      }
      else {
        console.log(data);
        console.log("found a object : " + input.keyName);
        fc.run_success_function(me.findObject, input);
      }
    });
  }

  me.listObjects = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3();
    var params = {
      Bucket: input.bucketName,
      /*Delimiter: 'STRING_VALUE',
      EncodingType: 'url',
      Marker: 'STRING_VALUE',
      MaxKeys: 0,
      Prefix: 'STRING_VALUE'*/
    };
    s3.listObjects(params, function(err, data) {
      if (err) {
        console.log("Error in listObjects : " + err, err.stack);
        fc.run_error_function(me.listObjects, err);
      }
      else {
        console.log(data);
        fc.run_success_function(me.listObjects, input);
      }
    });
  }

  me.putObject = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3();
    // read a zip file
    var fs = require("fs");
    data = fs.readFileSync(input.zipFile);
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
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log("Error in putObject : " + err, err.stack);
        fc.run_error_function(me.putObject, err);
      }
      else {
        console.log(data);
        console.log("succesfully updated object");
        fc.run_success_function(me.putObject, input);
      }
    });
  }

  me.deleteObject = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3();
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
    s3.deleteObjects(params, function(err, data) {
      if (err) {
        console.log("Error in deleteObjects : " + err, err.stack);
        fc.run_error_function(me.deleteObject, err);
      }
      else {
        console.log(data);
        console.log("succesfully deleted object");
        fc.run_success_function(me.deleteObject, input);
      }
    });
  }
}

module.exports = AWSS3Bucket
