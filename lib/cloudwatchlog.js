function AWSCloudWatchLog() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findService = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudwatchlogs = new AWS.CloudWatchLogs({region:input.region});
    return cloudwatchlogs;
  }

  me.findLogGroup = function(input) {
    var cloudwatchlogs = me.findService(input);
    var params = {
      limit: 1,
      logGroupNamePrefix: input.groupName,
      //nextToken: 'STRING_VALUE'
    };
    cloudwatchlogs.describeLogGroups(params, function(err, data) {
      if (err) {
        console.log("Error in describeLogGroups : " + err, err.stack);
        fc.run_error_function(me.findLogGroup, err);
      }
      else {
        if (data.logGroups[0]) {
          console.log("found a log group");
          console.log(data.logGroups[0]);
          fc.run_success_function(me.findLogGroup, input);
        }
        else {
          console.log("log group '" + input.groupName + "' not found");
          fc.run_failure_function(me.findLogGroup, input);
         }
      }
    });
    // { logGroups:
    //   [ { arn: 'arn:aws:logs:us-east-1:290093585298:log-group:alert_email_group:*',
    //       creationTime: 1438748551838,
    //       logGroupName: 'alert_email_group',
    //       metricFilterCount: 0,
    //       storedBytes: 0 } ] }
  }

  me.findLogStream = function(input) {
    var cloudwatchlogs = me.findService(input);
    var params = {
      logGroupName: 'alert_email_group', /* required */
      descending: true || false,
      limit: 1,
      logStreamNamePrefix: input.streamName,
      //nextToken: 'STRING_VALUE',
      //orderBy: 'LogStreamName | LastEventTime'
    };
    cloudwatchlogs.describeLogStreams(params, function(err, data) {
      if (err) {
        console.log("Error in describeLogStreams : " + err, err.stack);
        fc.run_error_function(me.findLogStream, err);
      }
      else {
        if (data.logStreams[0]) {
          console.log("found a log stream");
          console.log(data.logStreams[0]);
          fc.run_success_function(me.findLogStream, input);
        }
        else {
          console.log("log stream '" + input.streamName + "' not found");
          fc.run_failure_function(me.findLogStream, input);
         }
      }
    });
    // { logStreams:
    //   [ { arn: 'arn:aws:logs:us-east-1:290093585298:log-group:alert_email_group:log-stream:alert_email_log',
    //       creationTime: 1438748559193,
    //       firstEventTimestamp: 1438748712093,
    //       lastEventTimestamp: 1438748712093,
    //       lastIngestionTime: 1438748712680,
    //       logStreamName: 'alert_email_log',
    //       storedBytes: 0,
    //       uploadSequenceToken: '49540113702850512347249254807870490852946787696556136850' } ] }
  }

  me.createLogGroup = function(input) {
    var cloudwatchlogs = me.findService(input);
    var params = {
      logGroupName: input.groupName
    };
    cloudwatchlogs.createLogGroup(params, function(err, data) {
      if (err) {
        console.log("Error in createLogGroup : " + err, err.stack);
        fc.run_error_function(me.createLogGroup, err);
      }
      else {
        console.log(data);
        console.log("successfully created a log group : " + input.groupName);
        fc.run_success_function(me.createLogGroup, input);
      }
    });
  }

  me.createLogStream = function(input) {
    var cloudwatchlogs = me.findService(input);
    var params = {
      logGroupName: input.groupName,
      logStreamName: input.streamName
    };
    cloudwatchlogs.createLogStream(params, function(err, data) {
      if (err) {
        console.log("Error in createLogStream : " + err, err.stack);
        fc.run_error_function(me.createLogStream, err);
      }
      else {
        console.log(data);
        console.log("successfully created a log stream : " + input.streamName);
        fc.run_success_function(me.createLogStream, input);
      }
    });
  }

  me.findLogEvent = function(input) {
    var cloudwatchlogs = me.findService(input);
    var params = {
      logGroupName: input.groupName,
      logStreamName: input.streamName
      //endTime: 0,
      //limit: 0,
      //nextToken: 'STRING_VALUE',
      //startFromHead: true || false,
      //startTime: 0
    };
    cloudwatchlogs.getLogEvents(params, function(err, data) {
      if (err) {
        console.log("Error in getLogEvents : " + err, err.stack);
        fc.run_error_function(me.findLogStream, err);
      }
      else {
        if (data.events[0]) {
          console.log("found a log event");
          console.log(data.events[0]);
          fc.run_success_function(me.findLogEvent, input);
        }
        else {
          console.log("log event not found");
          fc.run_failure_function(me.findLogEvent, input);
         }
      }
    });
    // { events:
    //   [ { ingestionTime: 1438748712680,
    //       message: '{"a":"1234"}',
    //       timestamp: 1438748712093 } ],
    //  nextBackwardToken: 'b/32085168433100087642644596785626810381270473655812489216',
    //  nextForwardToken: 'f/32085168433100087642644596785626810381270473655812489216' }
  }

  me.createLogEvents = function(input) {
    var cloudwatchlogs = me.findService(input);
    var params = {
      logGroupName: input.groupName,
      logStreamName: input.streamName
      //sequenceToken: 'STRING_VALUE'
    };
    if (input.logEvents && input.logEvents.length > 0) {
      params.logEvents = input.logEvents;
    }
    else {
      params.logEvents = [
        {
          message: input.logMessage,
          timestamp: input.timestamp
        },
      ]
    }
    cloudwatchlogs.putLogEvents(params, function(err, data) {
      if (err) {
        console.log("Error in putLogEvents : " + err, err.stack);
        fc.run_error_function(me.createLogEvents, err);
      }
      else {
        console.log(data);
        console.log("successfully created a log event : " + input.timestamp);
        fc.run_success_function(me.createLogEvents, input);
      }
    });
    // { nextSequenceToken: '49540113702850512347249254807870490852946787696556136850' }
  }

  me.createLog = function(input, success_callback, failure_callback, error_callback) {
    var functionChain = [
      {func:me.findLogGroup, success:me.findLogStream, failure:me.createLogGroup, error:error_callback},
      {func:me.createLogGroup, success:me.findLogStream, failure:failure_callback, error:error_callback},
      {func:me.findLogStream, success:me.findLogEvent, failure:me.createLogStream, error:error_callback},
      {func:me.createLogStream, success:me.findLogEvent, failure:failure_callback, error:error_callback},
      {func:me.findLogEvent, success:success_callback, failure:me.createLogEvents, error:error_callback},
      {func:me.createLogEvents, success:success_callback, failure:failure_callback, error:error_callback},
    ]
    input.functionChain = functionChain;
    functionChain[0].func(input);
  }
}

module.exports = AWSCloudWatchLog
