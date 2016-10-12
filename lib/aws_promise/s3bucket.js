
var AWS = require('aws-sdk');

module.exports = {

  findService: function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var s3 = new AWS.S3(params);
    return s3;
  },

  findBucket: function(input) {
    var s3 = this.findService(input);
    return s3.listBuckets().promise().then(data => {
      var buckets = data.Buckets.filter(bucket => bucket.Name == input.bucketName);
      if (buckets.length > 0) return buckets[0];
      else return null;
    });
  },
  // { Buckets:
  //     [ { Name: '290093585298.alextest1',
  //         CreationDate: Wed Jul 08 2015 10:41:42 GMT-0400 (EDT) },
  //       {  } ],
  //    Owner:
  //     { DisplayName: 'AS.US.AWScto+sasi12',
  //       ID: 'a2199891147e2e5908faf16dc092ba87bc022402976a5afc30449f1ab9835593' }
  //  }

  createBucket: function(input) {
    return this.findBucket(input).then(bucket => {
      if (bucket) return Promise.resolve();
      else {
        var s3 = this.findService(input);
        params = { Bucket: input.bucketName };
        return s3.createBucket(params).promise();
      }
    });
  },

  getObject: function(input) {
    var s3 = this.findService(input);
    var params = {
      Bucket: input.bucket,
      Key: input.key
    }
    return s3.getObject(params).promise();
  },

  putObject: function(input) {
    var s3 = this.findService(input);
    //if (!input.sourceFolder || !input.src) {
    //  console.log('no change in the zip file, so just return');
    //  return null;
    //}
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
      Body: data,
    };
    if (input.acl) {
      params.ACL = input.acl;
    }
    return s3.putObject(params).promise();
  }

}
