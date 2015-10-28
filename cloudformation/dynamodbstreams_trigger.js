
var AWS = require('aws-sdk');

function DynamoDBStreams() {

  var me = this;

  me.updateTable = function(input, callback) {
    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var dynamodb = new AWS.DynamoDB(params);
    params = {
      TableName: input.tableName,
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_IMAGE'
      }
    };
    dynamodb.updateTable(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      }
      else {
        console.log(data);
        /*
        { TableDescription:
           { AttributeDefinitions: [ [Object] ],
             CreationDateTime: Mon Oct 26 2015 09:02:08 GMT-0500 (CDT),
             ItemCount: 1,
             KeySchema: [ [Object] ],
             LatestStreamArn: 'arn:aws:dynamodb:us-west-2:089476987273:table/alarmalerts/stream/2015-10-27T03:38:36.412',
             LatestStreamLabel: '2015-10-27T03:38:36.412',
             ProvisionedThroughput:
              { NumberOfDecreasesToday: 0,
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1 },
             StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_IMAGE' },
             TableArn: 'arn:aws:dynamodb:us-west-2:089476987273:table/alarmalerts',
             TableName: 'alarmalerts',
             TableSizeBytes: 219,
             TableStatus: 'UPDATING' } }
         */
        input.streamArn = data.TableDescription.LatestStreamArn;
        callback(null, input);
      }
    });
  }

  me.createEventSourceMapping = function(input, callback) {
    var params = {region: input.region};
    if (input.creds)  params.credentials = input.creds;
    var lambda = new AWS.Lambda(params);
    params = {
      EventSourceArn: input.streamArn,
      FunctionName: input.functionName,
      StartingPosition: 'LATEST',
      BatchSize: 10,
      Enabled: true
    };
    lambda.createEventSourceMapping(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      }
      else {
        console.log(data);
        /*
        { BatchSize: 10,
          EventSourceArn: 'arn:aws:dynamodb:us-west-2:089476987273:table/alarmalerts/stream/2015-10-27T03:38:36.412',
          FunctionArn: 'arn:aws:lambda:us-west-2:089476987273:function:index_alertmessages',
          LastModified: Mon Oct 26 2015 22:42:23 GMT-0500 (CDT),
          LastProcessingResult: 'No records processed',
          State: 'Creating',
          StateTransitionReason: 'User action',
          UUID: '59bafb76-7a7b-453b-8087-8463348d3adb' }
        */
        callback(null, input);
      }
    });
  }

  me.deploy = function(input, callback) {
    me.updateTable(input, function(err, data) {
      if (err)  callback(err);
      else {
        me.createEventSourceMapping(input, function(err, data) {
          if(err) callback(err);
          else callback(null, data);
        });
      }
    });
  }

  me.clean = function(input, callback) {
    callback(null, true);
  }

  me.build = function(action, packageJSON, callback) {
    var input = {
      region: packageJSON.region,
      tableName: packageJSON.tableName,
      functionName: packageJSON.functionName,
      creds: packageJSON.creds,
      streamArn: null
    };
    console.log(input);
    me[action](input, callback);
  }
}

module.exports = DynamoDBStreams
