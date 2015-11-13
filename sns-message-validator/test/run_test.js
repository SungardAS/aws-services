
sns_message =
{
  Type: 'Notification',
  MessageId: 'cef8ef43-1ce9-5151-93e9-a13332cd9480',
  TopicArn: 'arn:aws:sns:us-east-1:876224653878:OverIncreasedPercentagesSimTopic',
  Subject: 'ALARM: "OverIncreasedPercentagesSimAlarm-Test" in US - N. Virginia',
  Message: '{"AlarmName":"OverIncreasedPercentagesSimAlarm-Test","AlarmDescription":null,"AWSAccountId":"876224653878","NewStateValue":"ALARM","NewStateReason":"Threshold Crossed: 1 datapoint (14.218052862165425) was greater than the threshold (10.0).","StateChangeTime":"2015-09-14T02:07:32.209+0000","Region":"US - N. Virginia","OldStateValue":"INSUFFICIENT_DATA","Trigger":{"MetricName":"IncreasedPercentagesSim","Namespace":"CTOBilling","Statistic":"MAXIMUM","Unit":"Percent","Dimensions":[{"name":"None","value":"Percent"}],"Period":60,"EvaluationPeriods":1,"ComparisonOperator":"GreaterThanThreshold","Threshold":10.0}}',
  Timestamp: '2015-09-14T02:07:32.275Z',
  SignatureVersion: '1',
  Signature: 'CBARcyo7DXArRAvD8RZ7hh6q1y8Z5BAu+8sUXqqpGORoUmJhJITxhbJ/C55g4oxo0/pD5qozCB7TUYzCsnPW/+PWhEW65mr8hZnrLa+u6tLXiBYAIoBsYotoPxNA4523espcStDSKb8j5neYfrcKUJ0PPKADiZgrBjWatyGkdBB9+yyf12zvYlci6Y6DEJ38Ots3fcn9YNwrdfZ3TozyBqrYVNZQSthayJuXaiZ41cz8igvbxJJzJZv2nPqVJaQJc32RBb++YAqQ/Kxm0auAfCyLwwROD7Vrn3O7fmNf56Cvc6d70vXgQREBqW89K02tjFQId5NOs6DUBdvXq95B1A==',
  SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem',
  UnsubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:876224653878:OverIncreasedPercentagesSimTopic:4dc83337-9a73-46a9-b3c7-7ac7c5fcc089'
};

var validator = require('../sns-message-validator');
validator.validate(sns_message, function(err, data) {
  if(err) console.log(err);
  else console.log(data);
});
