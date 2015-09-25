
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSCloudWatchLog() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var cloudwatchlogs = new AWS.CloudWatchLogs(params);
    return cloudwatchlogs;
  }

  me.findLogGroup = function(input, callback) {

    var params = {
      limit: 1,
      logGroupNamePrefix: input.groupName,
      //nextToken: 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.describeLogGroups(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.logGroups[0]) {
        console.log("found a log group");
        console.log(data.logGroups[0]);
        return data.logGroups[0];
      }
      else {
        console.log("log group '" + input.groupName + "' not found");
        return null;
       }
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.describeLogGroups(params, me.callbackFind);
  }
  // { logGroups:
  //   [ { arn: 'arn:aws:logs:us-east-1:290093585298:log-group:alert_email_group:*',
  //       creationTime: 1438748551838,
  //       logGroupName: 'alert_email_group',
  //       metricFilterCount: 0,
  //       storedBytes: 0 } ] }

  me.findLogStream = function(input, callback) {

    var params = {
      logGroupName: input.groupName,
      descending: true || false,
      limit: 1,
      logStreamNamePrefix: input.streamName,
      //nextToken: 'STRING_VALUE',
      //orderBy: 'LogStreamName | LastEventTime'
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.describeLogStreams(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.logStreams[0]) {
        console.log("found a log stream");
        console.log(data.logStreams[0]);
        return data.logStreams[0];
      }
      else {
        console.log("log stream '" + input.streamName + "' not found");
        return null;
       }
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.describeLogStreams(params, me.callbackFind);
  }
  // { logStreams:
  //   [ { arn: 'arn:aws:logs:us-east-1:290093585298:log-group:alert_email_group:log-stream:alert_email_log',
  //       creationTime: 1438748559193,
  //       firstEventTimestamp: 1438748712093,
  //       lastEventTimestamp: 1438748712093,
  //       lastIngestionTime: 1438748712680,
  //       logStreamName: 'alert_email_log',
  //       storedBytes: 0,
  //       uploadSequenceToken: '49540113702850512347249254807870490852946787696556136850' } ] }

  me.createLogGroup = function(input, callback) {

    var params = {
      logGroupName: input.groupName
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.createLogGroup(params, callback);
      return;
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.createLogGroup(params, me.callback);
  }

  me.createLogStream = function(input, callback) {

    var params = {
      logGroupName: input.groupName,
      logStreamName: input.streamName
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.createLogStream(params, callback);
      return;
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.createLogStream(params, me.callback);
  }

  me.findLogEvent = function(input, callback) {

    var params = {
      logGroupName: input.groupName,
      logStreamName: input.streamName
      //endTime: 0,
      //limit: 0,
      //nextToken: 'STRING_VALUE',
      //startFromHead: true || false,
      //startTime: 0
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.getLogEvents(params, callback);
      return;
    }

    /*self.callbackFind = function(data) {
      if (data.events[0]) {
        console.log("found a log event");
        console.log(data.events[0]);
        return data.events[0];
      }
      else {
        console.log("log event not found");
        return null;
       }
    }*/

    var cloudwatchlogs = me.preRun(self, input);
    //cloudwatchlogs.getLogEvents(params, me.callbackFind);
    cloudwatchlogs.getLogEvents(params, me.callbackFindOne);
  }
  // { events:
  //   [ { ingestionTime: 1438748712680,
  //       message: '{"a":"1234"}',
  //       timestamp: 1438748712093 } ],
  //  nextBackwardToken: 'b/32085168433100087642644596785626810381270473655812489216',
  //  nextForwardToken: 'f/32085168433100087642644596785626810381270473655812489216' }

  me.createLogEvents = function(input, callback) {

    params = {
      logGroupName: input.groupName,
      logStreamName: input.streamName
    };
    if (input.logEvents)  params.logEvents = input.logEvents;
    else {
      params.logEvents = [ {
          message: input.logMessage,
          timestamp: input.timestamp
        } ];
    }
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.putLogEvents(params, callback);
      return;
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.putLogEvents(params, me.callback);
  }
  // { nextSequenceToken: '49540113702850512347249254807870490852946787696556136850' }

  me.createLog = function(input, success_callback, failure_callback, error_callback) {
    var flows = [
      {func:me.findLogGroup, success:me.findLogStream, failure:me.createLogGroup, error:error_callback},
      {func:me.createLogGroup, success:me.findLogStream, failure:failure_callback, error:error_callback},
      {func:me.findLogStream, success:me.findLogEvent, failure:me.createLogStream, error:error_callback},
      {func:me.createLogStream, success:me.findLogEvent, failure:failure_callback, error:error_callback},
      {func:me.findLogEvent, success:success_callback, failure:me.createLogEvents, error:error_callback},
      {func:me.createLogEvents, success:success_callback, failure:failure_callback, error:error_callback},
    ]
    me.flows = flows;
    flows[0].func(input);
  }

  me.fincMetricFromLogGroupEvent = function(input, callback) {
    var params = {
      logGroupName: input.groupName,
      ///filterNamePrefix: 'STRING_VALUE',
      //limit: 0,
      //nextToken: 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.describeMetricFilters(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.metricFilters[0]) {
        console.log("found a metric");
        console.log(data.metricFilters[0]);
        return data.metricFilters[0];
      }
      else {
        console.log("metric for '" + input.groupName + "' not found");
        return null;
       }
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.describeMetricFilters(params, me.callbackFind);
  }

  me.createMetricFromLogGroupEvents = function(input, callback) {
    /*input = {
          profile: 'default',
          region: 'us-east-1',
          metricFilterDefinition: {
            filterName: 'AlertEmailGroupEvents',
            filterPattern: '{$.count > 0}',
            logGroupName: 'alert_email_group',
            metricTransformations: [
              {
                metricName: 'AlertEmailGroupEventCount',
                metricNamespace: 'CloudTrailMetrics',
                metricValue: '1'
              }
            ]
          }
        }*/

    var params = input.metricFilterDefinition;
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.putMetricFilter(params, callback);
      return;
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.putMetricFilter(params, me.callback);
  }

  me.deleteMetricFromLogGroupEvent = function(input, callback) {
    var params = {
      filterName: input.metricFilterDefinition.filterName,
      logGroupName: input.groupName
    };
    var self = arguments.callee;

    if (callback) {
      var cloudwatchlogs = me.findService(input);
      cloudwatchlogs.deleteMetricFilter(params, callback);
      return;
    }

    var cloudwatchlogs = me.preRun(self, input);
    cloudwatchlogs.deleteMetricFilter(params, me.callback);
  }
}

module.exports = AWSCloudWatchLog
