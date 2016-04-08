
exports.handler = function (event, context) {

  console.log(JSON.stringify(event));
  var region = event.region;
  console.log("region = " + region);

  var awsid = event.account;
  console.log("awsid = " + awsid);

  var kms = new (require('../lib/aws/kms.js'))();
  var gmail = new (require('../lib/google/gmail.js'))();
  var dynamodb = new (require('../lib/aws/dynamodb.js'))();
  var aws_watch = new (require('../lib/aws/cloudwatch.js'))();

  var fs = require("fs");
  var config = fs.readFileSync(__dirname + '/config/' + event.account + '.json', {encoding:'utf8'});
  var config_json = JSON.parse(config);
  console.log(config_json['googleAuth']);

  var current = new Date();
  var input = {
    region: region,
    key: config_json['key'],
    encryptedStr: config_json['googleAuth'],
    labelId: 'INBOX',
    userId: 'me',
    queryForMessageList: 'is:unread',
    messages: [],
    labelsToAdd: [],
    labelsToRemove: ['UNREAD'],
    tableName: 'alarmalerts',
    item: null
  };

  var metricData = {
    MetricData: [
      {
        MetricName: 'AlertEmailCount',
        Dimensions: [
        ],
        Timestamp: null,
        Unit: 'Count',
        Value: null
      }
    ],
    Namespace: 'AlertEmailMetrics'
  };

  function errored(err) { context.fail(err, null); }
  function failed(input) { context.done(null, false); }
  function done(input) { context.done(null, true); }

  function addAuthInfo(input) {
    var auth = JSON.parse(input.decryptedStr);
    input.clientId = auth.client_id;
    input.clientSecret = auth.client_secret;
    input.redirectUrl = auth.redirect_uris;
    input.token = auth.token;
    input.decryptedStr = null;  // remove the decrypted str from input params
    gmail.listMessages(input);
  }

  function saveMessages(input) {
    saveMessage(input, input.messages.length-1, changeMessageLabels);
  }

  // save each message
  function saveMessage(input, idx, callback) {

    input.currentMessage = input.messages[idx];
    gmail.getMessage(input, function(err, data) {
      if (err) {
        console.log("failed to get message [" + message.id + "] : " + err);
        errored(err);
      }

      console.log(JSON.stringify(data, null, "  "));
      var messageId = data.id;
      var sentBy = data.payload.headers.filter(function(header) {return header.name == "From";})[0].value;
      var sentAt = data.payload.headers.filter(function(header) {return header.name == "Date";})[0].value;
      var subject = data.payload.headers.filter(function(header) {return header.name == "Subject";})[0].value;
      var message = '';
      if (data.payload.body.data) {
        var decoded = new Buffer(data.payload.body.data, 'base64').toString('ascii');
        message = decoded;
      }
      else if (data.payload.parts[0] && data.payload.parts[0].body.data) {
        var decoded = new Buffer(data.payload.parts[0].body.data, 'base64').toString('ascii');
        message = decoded;
      }
      else {
        message = "Unable to read message. Please see the original email for message content."
      }

      var item = {
          "id": {"S": messageId},
          "awsid": {"S": awsid},
          "subject": {"S": subject},
          "message": {"S": message},
          "sentBy": {"S": sentBy},
          "sentAt": {"S": new Date(Date.parse(sentAt)).toISOString()},
          "createdAt": {"S": current.toISOString()},
          "updatedAt": {"S": current.toISOString()},
          "account": {"N": "0"},
          "archivedBy": {"S": "none"}
      };
      console.log(item);
      input.item = item;
      dynamodb.save(input, function(err, data) {
        if (err) {
          console.log('failed to save a message : ' + err);
          //errored(err);
        }
        else {
          console.log('successfully saved a message : ' + JSON.stringify(item, null, '  '));
        }
        if (--idx < 0) {
          console.log('all messages were processed');
          callback(input);
        }
        else {
          saveMessage(input, idx, callback);
        }
      });
    });
  }

  function changeMessageLabels(input) {
    changeMessageLabel(input, 0, buildMetricsData);
  }

  function changeMessageLabel(input, idx, callback) {
    input.currentMessage = input.messages[idx];
    gmail.changeLabel(input, function(err, data) {
      if (err) {
        console.log("failed to get message [" + message.id + "] : " + err);
        errored(err);
      }
      if (++idx == input.messages.length) {
        callback(input);
      }
      else {
        changeMessageLabel(input, idx, callback);
      }
    });
  }

  function buildMetricsData(input) {
    console.log('<<<Starting buildMetricsData...');
    metricData.MetricData[0].Timestamp = current;
    metricData.MetricData[0].Value = input.messages.length;
    input.metricData = metricData;
    console.log(JSON.stringify(input));
    console.log('>>>...completed buildIMetricsData');
    aws_watch.addMetricData(input);
  }

  var flows = [
    {func:kms.decrypt, success:addAuthInfo, failure:failed, error:errored},
    {func:addAuthInfo, success:gmail.listMessages, failure:failed, error:errored},
    {func:gmail.listMessages, success:saveMessages, failure:done, error:errored},
    {func:saveMessages, success:changeMessageLabels, failure:failed, error:errored},
    {func:changeMessageLabels, success:done, failure:failed, error:errored},
    {func:changeMessageLabels, success:buildMetricsData, failure:failed, error:errored},
    {func:buildMetricsData, success:aws_watch.addMetricData, failure:failed, error:errored},
    {func:aws_watch.addMetricData, success:done, failure:failed, error:errored},
  ];

  kms.flows = flows;
  gmail.flows = flows;
  dynamodb.flows = flows;
  aws_watch.flows = flows;

  flows[0].func(input);
};
