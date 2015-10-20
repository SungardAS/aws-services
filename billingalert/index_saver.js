
var dynamodb = new (require('../lib/aws/dynamodb.js'))();

exports.handler = function (event, context) {

  console.log(event.Records[0].Sns);

  // find a given region
  var regionArray = [
    {id:'us-east-1', name:'US - N. Virginia'},
    {id:'us-west-1', name:'US - N. California'},
    {id:'us-west-2', name:'US - Oregon'},
  ];
  var message_json = JSON.parse(event.Records[0].Sns.Message);
  var regions = regionArray.filter(function(region) {
    return region.name == message_json.Region;
  });
  var region = (regions[0]) ? regions[0].id : regionArray[0].id;

  var messageId = event.Records[0].Sns.MessageId;
  var subject = event.Records[0].Sns.Subject;
  var message = event.Records[0].Sns.Message;
  var sentBy = event.Records[0].Sns.TopicArn;
  var sentAt = event.Records[0].Sns.Timestamp;
  var awsid = null;
  var awsids = message_json.Trigger.Dimensions.filter(function(dimension) {
    return dimension.name == 'LinkedAccount';
  });
  if (awsids[0])  awsid = awsids[0].value;
  else awsid = message_json.AWSAccountId;
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
