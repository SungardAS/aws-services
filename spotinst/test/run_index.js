
var i = require('../index.js');
/*var event = {
  "account": "089476987273",
  "region": "us-east-1",
  "dryRun": false,
  "instanceId": "i-a5f7153c",
  "name": "dev-api-elastigroup",
  "description": "ElastiGroup of dev-api",
  "tags": "[{\"Key\":\"Name\",\"Value\":\"dev-api-spotinst\"}]",
  "keyPairName": "alex-us-east-1-key",
  "spotinstAccessKey": ""
}*/
var event = {
  "account": "089476987273",
  "region": "us-east-1",
  "dryRun": true,
  "instanceId": "i-79dea6e4",
  "name": "db-accessor-elastigroup",
  "description": "ElastiGroup of db-accessor",
  "tags": "[{\"Key\":\"Name\",\"Value\":\"db-accessor-spotinst\"}]",
  "keyPairName": "alex-us-east-1-key",
  "spotinstAccessKey": ""
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
