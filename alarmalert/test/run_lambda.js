
var argv = require('minimist')(process.argv.slice(2));
var module = argv._[0];
if (!module || (module != 'cron' && module != 'saver')) {
  console.log(module);
  console.log("node run_lambda cron|saver");
  return;
}

var event = {
  "Records": [
    {
      "EventSource": "aws:sns",
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:us-east-1:876224653878:CTOCronTopic:54ee549e-6874-4028-9826-09759863b22c",
      "Sns": {
        "Type": "Notification",
        "MessageId": "7750e58b-d233-54b4-afb7-abf5bb793b18",
        "TopicArn": "arn:aws:sns:us-east-1:876224653878:CTOCronTopic",
        "Subject": "ALARM: \"CTOCronAlarm\" in US - N. Virginia",
        "Message": "{\"AlarmName\":\"CTOCronAlarm\",\"AlarmDescription\":\"Alerted whenever new message is delivered to 'CTOCronQueue'\",\"AWSAccountId\":\"876224653878\",\"NewStateValue\":\"ALARM\",\"NewStateReason\":\"Threshold Crossed: 1 datapoint (1.0) was greater than the threshold (0.0).\",\"StateChangeTime\":\"2015-09-24T21:11:38.523+0000\",\"Region\":\"US - N. Virginia\",\"OldStateValue\":\"OK\",\"Trigger\":{\"MetricName\":\"ApproximateNumberOfMessagesVisible\",\"Namespace\":\"AWS/SQS\",\"Statistic\":\"AVERAGE\",\"Unit\":\"Count\",\"Dimensions\":[{\"name\":\"QueueName\",\"value\":\"CTOCronQueue\"}],\"Period\":60,\"EvaluationPeriods\":1,\"ComparisonOperator\":\"GreaterThanThreshold\",\"Threshold\":0.0}}",
        "Timestamp": "2015-09-24T21:11:38.608Z",
        "SignatureVersion": "1",
        "Signature": "GK0Ss1kF8xMcHod318S2AQMR39UzlreNkcf+DjWqCoY+Gp2dOGTnuN3wf89QBlxPrEjPK/4JMNvCyfOoz7unH2y0QvELXvt7ToDSK4XE+1YcT2DY0QcFvr5af3TdQTF8e2cB3iBZ93ktt/uAWykj4/nzDSU09+W0nFhQURflmowlAnn5X5Z8icx0G+v+npCTED3fFgA4JnKm2PDqcmUB6Z3d5iIYQmeOGKkIUZbPZ3TtoGubg94OBncpH6F8fsXXvygIZDq9eO4sb5MTGTje7iRiEyCwc6z0evNbWiNeOWp0XGwQRov6ZiNeUW9gxSM192S2Q29PmHC0OejgQZmQiQ==",
        "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem",
        "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:876224653878:CTOCronTopic:54ee549e-6874-4028-9826-09759863b22c",
        "MessageAttributes": {}
      }
    }
  ]
}

event.roles = [
  {roleArn:'arn:aws:iam::089476987273:role/cto_across_accounts'},
  {roleArn:'arn:aws:iam::089476987273:role/federate'},
  {roleArn:'arn:aws:iam::876224653878:role/sgas_dev_admin', externalId:''}
];
event.sessionName = "abcde";

var i = require('../index_' + module);
var context = {fail:function(a){console.log(a)}, done:function(e, a){console.log(a)}};
i.handler(event, context);