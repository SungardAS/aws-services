
exports.handler = function (event, context) {

  var gmail = new (require('../lib/google/gmail.js'))();
  var aws_watchlog = new (require('../lib/aws/cloudwatchlog.js'))();

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: event.region,
    labelId: 'INBOX',
    userId: 'me',
    queryForMessageList: 'is:unread',
    messages: [],
    labelsToAdd: [],
    labelsToRemove: ['UNREAD'],
    groupName: data_json.eventLogGroupName,
    streamName: null
  };

  function errored(err) { context.faile(err, null); }
  function failed(input) { context.done(null, false); }
  function done(input) { context.done(null, true); }

  // build log events for all messages along with a summary log
  function buildLogEvents(input) {
    input.streamName = input.messages[0].id + '.' + input.messages[input.messages.length-1].id;
    input.logEvents = [];
    buildMessageLog(input, input.messages.length-1, aws_watchlog.findLogGroup);
  }

  // build a log event data for each message
  function buildMessageLog(input, idx, callback) {
    input.currentMessage = input.messages[idx];
    gmail.getMessage(input, function(err, data) {
      if (err) {
        console.log("failed to get message [" + message.id + "] : " + err);
        errored(err);
      }
      var date = data.payload.headers.filter(function(header){ return header.name=='Date';})[0].value
      console.log('###date = ' + date);
      if (data.payload.body.data) {
        var decoded = new Buffer(data.payload.body.data, 'base64').toString('ascii');
        data.payload.body.data = decoded;
        console.log(data);
      }
      //var messageLog = { message: JSON.stringify(data), timestamp: new Date(date).getTime() };
      var messageLog = { message: JSON.stringify(data), timestamp: new Date().getTime() };
      input.logEvents.push(messageLog);
      console.log(">>>...added log event : completed")

      if (--idx < 0) {
        // add a summary log event
        var messageLog = { message: JSON.stringify({count: input.messages.length}), timestamp: new Date().getTime() };
        input.logEvents.push(messageLog);
        callback(input);
      }
      else {
        buildMessageLog(input, idx, callback);
      }
    });
  }

  function changeMessageLabels(input) {
    changeMessageLabel(input, 0, done);
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

  // flows for main task
  var flows = [
    {func:gmail.listMessages, success:buildLogEvents, failure:done, error:errored},
    {func:buildLogEvents, success:aws_watchlog.findLogGroup, failure:failed, error:errored},
    {func:aws_watchlog.findLogGroup, success:aws_watchlog.findLogStream, failure:aws_watchlog.createLogGroup, error:errored},
    {func:aws_watchlog.createLogGroup, success:aws_watchlog.findLogStream, failure:failed, error:errored},
    {func:aws_watchlog.findLogStream, success:aws_watchlog.createLogEvents, failure:aws_watchlog.createLogStream, error:errored},
    {func:aws_watchlog.createLogStream, success:aws_watchlog.createLogEvents, failure:failed, error:errored},
    {func:aws_watchlog.createLogEvents, success:changeMessageLabels, failure:failed, error:errored},
    {func:changeMessageLabels, success:done, failure:failed, error:errored},
  ]
  input.flows = flows;
  gmail.flows = flows;
  aws_watchlog.flows = flows;
  flows[0].func(input);
}
