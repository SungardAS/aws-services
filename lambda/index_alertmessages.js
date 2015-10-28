
var dynamodb = new (require('../lib/aws/dynamodb.js'))();

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  var region = 'us-east-1';
  save(event.Records, 0, region, function(err, data) {
    if (err) {
      context.fail(err, null);
    }
    else {
      context.done(null, true);
    }
  });
}

function save(records, idx, region, callback) {

  var record = records[idx];
  console.log(record.eventID);
  console.log(record.eventName);
  console.log('DynamoDB Record[' + idx + ']: %j', record.dynamodb);
  /*
  {
    "Keys": {
      "id": {
        "S": "4ac2077f-11d0-5aba-9288-49d75c4b2769"
      }
    },
    "NewImage": {
      "awsid": {
        "S": "876224653878"
      },
      "subject": {
        "S": "ALARM: \"876224653878-OverIncreasedPercentagesSimAlarm-Test\" in US-West-2"
      },
      "id": {
        "S": "4ac2077f-11d0-5aba-9288-49d75c4b2769"
      },
      "sentAt": {
        "S": "2015-10-26T15:48:43.656Z"
      },
      "message": {
        "S": "{\"AlarmName\":\"876224653878-OverIncreasedPercentagesSimAlarm-Test\",\"AlarmDescription\":\"Alerted whenever the linked account's IncreasedPercentages[Sim] metric has new data.\",\"AWSAccountId\":\"089476987273\",\"NewStateValue\":\"ALARM\",\"NewStateReason\":\"Threshold Crossed: 1 datapoint (11.0) was greater than the threshold (10.0).\",\"StateChangeTime\":\"2015-10-26T15:48:43.548+0000\",\"Region\":\"US-West-2\",\"OldStateValue\":\"INSUFFICIENT_DATA\",\"Trigger\":{\"MetricName\":\"IncreasedPercentagesSim\",\"Namespace\":\"CTOBilling\",\"Statistic\":\"MAXIMUM\",\"Unit\":\"Percent\",\"Dimensions\":[{\"name\":\"LinkedAccount\",\"value\":\"876224653878\"},{\"name\":\"None\",\"value\":\"Percent\"}],\"Period\":60,\"EvaluationPeriods\":1,\"ComparisonOperator\":\"GreaterThanThreshold\",\"Threshold\":10.0}}"
      },
      "sentBy": {
        "S": "arn:aws:sns:us-west-2:089476987273:OverIncreasedPercentagesSimTopic"
      }
    },
    "SequenceNumber": "29600000000000440906455",
    "SizeBytes": 1017,
    "StreamViewType": "NEW_IMAGE"
  }
  */
  if (record.eventName != "INSERT") {
    console.log("The event is not INSERT, so move to the next record");
    if (++idx == records.length) {
      callback(null, true);
    }
    else {
      save(records, idx, region, callback);
    }
  }
  else {
    var current = new Date();
    var item = {
        "id": record.dynamodb.NewImage.id,
        "awsid": record.dynamodb.NewImage.awsid,
        "subject": record.dynamodb.NewImage.subject,
        "message": record.dynamodb.NewImage.message,
        "sentBy": record.dynamodb.NewImage.sentBy,
        "sentAt": record.dynamodb.NewImage.sentAt,
        "createdAt": {"S": current.toISOString()},
        "updatedAt": {"S": current.toISOString()},
        "account": {"N": '0'},
        "archivedBy": {"S": "none"},
        "source": {"S": record.eventSourceARN},
        "sequenceNumber": {"S": record.dynamodb.SequenceNumber}
    }
    console.log(item);

    var input = {
      region: region,
      tableName: 'alertmessages',
      item: item
    };

    dynamodb.save(input, function(err, data) {
      if (err) {
        console.log("failed to save record[" + idx + "] : " + err);
        callback(err, null);
      }
      else {
        if (++idx == records.length) {
          callback(null, true);
        }
        else {
          save(records, idx, region, callback);
        }
      }
    });
  }
}
