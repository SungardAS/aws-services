
var dynamodb = new (require('../lib/aws/dynamodb.js'))();

exports.handler = function (event, context) {

  console.log(event.Records[0].Sns);

  /*var fs = require("fs");
  var data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  var data_json = JSON.parse(data);

  var roles = [];
  if (data_json.profile) {
    roles.push({roleArn:'arn:aws:iam::' + data_json.federateAccount + ':role/cto_across_accounts'});
  }
  roles.push({roleArn:'arn:aws:iam::' + data_json.federateAccount + ':role/federate'});
  var admin_role = {roleArn:'arn:aws:iam::' + data_json.dynamodbAccount + ':role/' + data_json.roleName};
  if (data_json.roleExternalId) {
    admin_role.externalId = data_json.roleExternalId;
  }
  roles.push(admin_role);
  console.log(roles);
  var sessionName = data_json.sessionName;
  var region = data_json.region;*/

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

  /*if (roles && roles.length > 0) {
    var assume_role_provider = new (require('../lib/aws/assume_role_provider.js'))();
    assume_role_provider.getCredential(roles, sessionName, 0, null, function(err, data) {
      if (err) {
        console.log("Failed to assume roles : " + err);
        context.fail("Failed to assume roles : " + err);
      }
      else {
        input.creds = data;
        dynamodb.save(input, function(err, data) {
          if (err)  context.fail(err, null);
          else {
            context.done(null, true);
          }
        });
      }
    });
  }
  else {*/
    dynamodb.save(input, function(err, data) {
      if (err)  context.fail(err, null);
      else {
        context.done(null, true);
      }
    });
  //}
}
