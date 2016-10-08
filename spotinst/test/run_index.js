
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
  "federateRoleArn": "arn:aws:iam::089476987273:role/federate",
  "accountRoleArn": "arn:aws:iam::290093585298:role/sgas_dev_admin",
  "externalId": "ccb6cfce-057c-4fbc-84b9-1ee10e8b6560",
  "account": "290093585298",
  "region": "us-east-1",
  "dryRun": true,
  "instanceId": "i-44f46dbc",
  "name": "Docker-Manager-elastigroup",
  "description": "ElastiGroup of Docker-Manager",
  "tags": "[{\"Key\":\"Name\",\"Value\":\"Docker-Manager-spotinst\"}]",
  "keyPairName": "alex-us-east-1-key",
  "spotinstAccessKey": "e5bd4dd2ed466b29a223f3da78870dbd0791e3cbe130f4d58fe9ec16c98b6e4f"
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(JSON.stringify(data, null, 2));
});
