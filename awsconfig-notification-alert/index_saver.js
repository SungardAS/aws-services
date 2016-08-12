var dynamodb = new (require('../lib/aws/dynamodb.js'))();

exports.handler = function (event, context) {

  console.log(event.Records[0].Sns);
  var message_json = JSON.parse(event.Records[0].Sns.Message);
  var region = event.Records[0].EventSubscriptionArn.split(":")[3];
  var messageId = event.Records[0].Sns.MessageId;
  var subject = event.Records[0].Sns.Subject;
//  var message = message_json.NewStateReason;
  var message = event.Records[0].Sns.Message;
  var sentBy = event.Records[0].Sns.TopicArn;
  var sentAt = event.Records[0].Sns.Timestamp;
  //var awsid = null;
  var awsid = message_json.awsAccountId;
//  var awsids = message_json.Trigger.Dimensions.filter(function(dimension) {
  //  return dimension.name == 'LinkedAccount';
 // });
//  if (awsids[0])  awsid = awsids[0].value;
 // else awsid = message_json.AWSAccountId;
  var current = new Date();
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
          tableName: 'notificationalerts',
          item: item
        };

        dynamodb.save(input, function(err, data) {
          if (err)  context.fail(err, null);
          else {
            context.done(null, true);
          }
        });
}
