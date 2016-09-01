
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

const EVALUATION_TYPES = {
    COMPLAINT: 'COMPLIANT',
    NON_COMPLIANT: 'NON_COMPLIANT',
}

function AWSS3BucketLogging() {

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
      console.log(buckets);
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


function getEvaluationParam(st, sgId, input) {
       var eval = [];
       complianceType= EVALUATION_TYPES.NON_COMPLIANT
       if(st){
          complianceType= EVALUATION_TYPES.COMPLAINT 
       }
       eval.push({
           ComplianceResourceType: input.resourceType,
           ComplianceResourceId: sgId,
           ComplianceType: complianceType,
           OrderingTimestamp: input.timeStamp,
       });
       return eval;
    }

 me.findBucketLogging = function(input, callback) {

    var params = {
      Bucket: input.bucketName /* required */
    };
    var self = arguments.callee;

    if (callback) {
      var s3 = me.findService(input);
      s3.getBucketLogging(params, callback);
      return;
    }

    self.callbackFind = function(data) {
    var hasRules = false;
      if(data.LoggingEnabled) {
        console.log("found Logging Enabled");
        console.log(data);
	hasRules = true;
//        return data;
	 return harRules;
      }
      else {
        console.log("Logging of the bucket '" + input.bucketName + "' not enabled."); 
        return harRules;
       }
    input.evaluations=getEvaluationParam(hasRules, input.bucketName, input);
    aws_config.sendEvaluations(input);
    }
   self.addParams = function(found) {
            self.params.hasRules = found;
   
   var s3 = me.preRun(self, input);
    s3.getBucketLogging(params, me.callbackFind);
  }


}

module.exports = AWSS3BucketLogging
