
var i = require('../index.js');
var event = { "Records": [ { "eventVersion": "2.0", "eventSource": "aws:s3", "awsRegion": "us-east-1", "eventTime": "2016-09-01T15:53:59.538Z", "eventName": "ObjectCreated:Put", "userIdentity": { "principalId": "AWS:AIDAJLSI7DTYBUZAOKHVM" }, "requestParameters": { "sourceIPAddress": "10.89.169.43" }, "responseElements": { "x-amz-request-id": "DCD33B3CE5F2D82A", "x-amz-id-2": "pSlPFAdp4ijpnliKBe7zZhUexFSZU9yQLk6G23o0D75ttLU9KFJekr92sifyZ170" }, "s3": { "s3SchemaVersion": "1.0", "configurationId": "143b5369-8aff-4660-9ad3-73dc0c27cf4e", "bucket": { "name": "billing.cto.sungardas.com.test.redshift", "ownerIdentity": { "principalId": "A1GQS5AHI5WEA5" }, "arn": "arn:aws:s3:::billing.cto.sungardas.com.test.redshift" }, "object": { "key": "/FeedToRedshift/20160901-20161001/f09e384d-752d-4831-8a35-a4efff3b3f0c/FeedToRedshift-RedshiftCommands.sql", "size": 3784, "eTag": "54abf444744977cc53dfe9e4155676c3", "sequencer": "0057C84F177D540F47" } } } ] }
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
