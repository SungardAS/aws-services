
var i = require('../index.js');
var event = {
  "Records": [
    {
      "eventVersion": "2.0",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "2016-09-03T04:31:40.459Z",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "AWS:AIDAJLSI7DTYBUZAOKHVM"
      },
      "requestParameters": {
        "sourceIPAddress": "10.89.169.43"
      },
      "responseElements": {
        "x-amz-request-id": "322F9E3C1255BD0B",
        "x-amz-id-2": "kl5s8a8uiAmGiMbgl/ew5Oj+XDSqY+P/i23yR27OOwVCm5w5U8D+yJZJB6OlBrzo"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "b190ec21-037b-4a88-a1cf-d788b56b1608",
        "bucket": {
          "name": "billing.cto.sungardas.com.test.redshift",
          "ownerIdentity": {
            "principalId": "A1GQS5AHI5WEA5"
          },
          "arn": "arn:aws:s3:::billing.cto.sungardas.com.test.redshift"
        },
        "object": {
          "key": "/FeedToRedshift/20160901-20161001/b2714d0c-979b-4ec6-9e08-abcd4af6be00/FeedToRedshift-RedshiftCommands.sql",
          "size": 3784,
          "eTag": "1fd92a660477317d0b941392a66314ad",
          "sequencer": "0057CA522C6A3D839A"
        }
      }
    }
  ]
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
