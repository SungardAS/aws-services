
var i = require('../index_ec2_with_low_usages.js');
var accountRoleArns = {
  '089476987273': {arn: 'arn:aws:iam::089476987273:role/sgas_dev_admin', externalId: ''},
  '054649790173': {arn: 'arn:aws:iam::054649790173:role/sgas_dev_admin', externalId: ''},
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
