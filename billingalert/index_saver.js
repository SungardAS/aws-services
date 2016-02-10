
var metrics = new (require('./metrics'))();
var dynamodb = new (require('../lib/aws/dynamodb.js'))();

exports.handler = function (event, context) {

  console.log(event.Records[0].Sns);
  var message_json = JSON.parse(event.Records[0].Sns.Message);

  var region = event.Records[0].EventSubscriptionArn.split(":")[3];

  var messageId = event.Records[0].Sns.MessageId;
  var subject = event.Records[0].Sns.Subject;
  var message = message_json.NewStateReason;
  var sentBy = event.Records[0].Sns.TopicArn;
  var sentAt = event.Records[0].Sns.Timestamp;
  var awsid = null;
  var awsids = message_json.Trigger.Dimensions.filter(function(dimension) {
    return dimension.name == 'LinkedAccount';
  });
  if (awsids[0])  awsid = awsids[0].value;
  else awsid = message_json.AWSAccountId;
  var current = new Date();

  metrics.isIncreasedUsagesOver(awsid, region, current, function(err, data) {
    if (err) {
      context.fail(err, null);
    }
    else {
      if (!data) {
        // the increased usage is not what should be alerted
        context.done(null, true);
      }
      else {
        var item = {
            "id": {"S": messageId},
            "awsid": {"S": awsid},
            "subject": {"S": subject},
            "message": {"S": message},
            "sentBy": {"S": sentBy},
            "sentAt": {"S": sentAt},
            //"createdAt": {"S": current.toISOString()},
            //"updatedAt": {"S": current.toISOString()},
            //"account": {"N": '0'},
            //"archivedBy": {"S": "none"}
        }
        console.log(item);

        var input = {
          region: region,
          tableName: 'billingalerts',
          item: item
        };

        dynamodb.save(input, function(err, data) {
          if (err)  context.fail(err, null);
          else {
            context.done(null, true);
          }
        });
      }
    }
  });
}
