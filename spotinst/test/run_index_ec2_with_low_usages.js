
var i = require('../index_ec2_with_low_usages.js');
var accountRoleArns = {
  '089476987273': {arn: 'arn:aws:iam::089476987273:role/sgas_dev_admin', externalId: '88df904d-c597-40ef-8b29-b767aba1eaa4'},
  '054649790173': {arn: 'arn:aws:iam::054649790173:role/sgas_dev_admin', externalId: '0b6318ce-41ac-4774-87ae-2b6da44a78d1'},
}
var event = {
  "region": "us-east-1",
  "federateRoleArn": "arn:aws:iam::089476987273:role/federate",
  "accountRoleArn": accountRoleArns['089476987273'].arn,
  "externalId": accountRoleArns['089476987273'].externalId
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
