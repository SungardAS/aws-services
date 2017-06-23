
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSConfig() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var configService = new AWS.ConfigService(params);
    return configService;
  }

  me.enableRule = function(input) {
    var self = arguments.callee;
    var configService = me.findService(input);
    var params = {
        ConfigRule:{
            ConfigRuleName:input.ruleName,
            Description:input.descript,
            Source: {
                Owner: input.owner,
                SourceIdentifier: input.sourceID,
            },
           Scope: {ComplianceResourceTypes: input.resourceType},
           InputParameters: input.params
        }
    };
    if(input.owner == "CUSTOM_LAMBDA") {
        params.ConfigRule.Source.SourceDetails = [
            {
                "EventSource": "aws.config",
                "MessageType": "ConfigurationItemChangeNotification"
            }
        ];
    }

    configService.putConfigRule(params, function (err, data) {
       if (err) {
          console.log(err, err.stack);
       } else {
          console.log(data)
       }
    });
    return null;
  }

  me.getCreatedRules = function(input, callback) {

    var self = arguments.callee;
    var params = {ConfigRuleNames: []}
    var configService = me.findService(input);
    if (callback) {
       var configService = me.findService(input);
       configService.describeConfigRules(params, callback);
       return;
   }
   self.callbackFind = function(data) {
       return data;
   }
   self.addParams = function(found) {
       self.params.rules = found;
   }
   var configService = me.preRun(self, input);
   configService.describeConfigRules(params, me.callbackFind);
  }

  me.findRecorders = function(input, callback) {

    params = {}
    //if (input.configRecorderName)  params.ConfigurationRecorderNames = [input.configRecorderName];
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.describeConfigurationRecorders(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.ConfigurationRecorders[0]) {
        console.log('found recorder(s)');
        return data.ConfigurationRecorders[0];
      }
      else {
        console.log("no recorder(s) found");
        return null;
       }
    }

    self.addParams = function(found) {
      self.params.configRecorderName = found.name;
    }

    var configService = me.preRun(self, input);
    configService.describeConfigurationRecorders(params, me.callbackFind);
  }
  // { ConfigurationRecorders:
  //     [ { name: 'default',
  //         recordingGroup: [Object],
  //         roleARN: 'arn:aws:iam::290093585298:role/lambda_config_setup_role' } ] }

  me.setRoleInRecorder = function(input, callback) {

    params = {
      ConfigurationRecorder: {
        name: input.configRecorderName,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
          resourceTypes: []
        },
        roleARN: input.roleArn
      }
    };
    //console.log(params);
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.putConfigurationRecorder(params, callback);
      return;
    }

    var configService = me.preRun(self, input);
    configService.putConfigurationRecorder(params, me.callback);
  }

  me.findChannels = function(input, callback) {

    params = {}
    //if (input.deliveryChannelName)  params.DeliveryChannelNames = [input.deliveryChannelName];
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.describeDeliveryChannels(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.DeliveryChannels[0]) {
        console.log('successfully found channel(s)');
        return data.DeliveryChannels[0];
      }
      else {
        console.log("no channel(s) found");
        return null;
       }
    }

    self.addParams = function(found) {
      self.params.deliveryChannelName = found.name;
    }

    var configService = me.preRun(self, input);
    configService.describeDeliveryChannels(params, me.callbackFind);
  }
  // { DeliveryChannels:
  //     [ { name: 'default',
  //         s3BucketName: '290093585298.awsconfig',
  //         snsTopicARN: 'arn:aws:sns:us-west-2:290093585298:config-topic-temp' } ] }

  me.setChannel = function(input, callback) {

    params = {
      DeliveryChannel: {
        name: input.deliveryChannelName,
        s3BucketName: input.bucketName,
        s3KeyPrefix: null,
        snsTopicARN: input.topicArn
      }
    };
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.putDeliveryChannel(params, callback);
      return;
    }

    var configService = me.preRun(self, input);
    configService.putDeliveryChannel(params, me.callback);
  }
  // {}

  me.findRecordersStatus = function(input, callback) {

    params = {}
    if (input.configRecorderName)  params.ConfigurationRecorderNames = [input.configRecorderName];
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.describeConfigurationRecorderStatus(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.ConfigurationRecordersStatus[0]) {
        if (data.ConfigurationRecordersStatus[0].recording) {
          console.log('recording is currently on');
          return data.ConfigurationRecordersStatus[0];
        }
        else {
          console.log('recording is currently off');
          return null;
        }
      }
      else {
        console.log("No recorder status found in describeConfigurationRecorderStatus");
        return null;
      }
    }

    self.addParams = function(found) {
      self.params.configRecorderName = found.name;
    }

    var configService = me.preRun(self, input);
    configService.describeConfigurationRecorderStatus(params, me.callbackFind);
  }
  // { ConfigurationRecordersStatus:
  //     [ { lastStartTime: Mon Jul 13 2015 16:00:30 GMT-0400 (EDT),
  //         lastStatus: 'SUCCESS',
  //         lastStatusChangeTime: Fri Jul 17 2015 16:00:45 GMT-0400 (EDT),
  //         lastStopTime: Fri Jul 17 2015 17:25:14 GMT-0400 (EDT),
  //         name: 'default',
  //         recording: false } ] }


  // The channels must be created first. We'll get below error if there is no channel.
  // 'NoAvailableDeliveryChannelException: Delivery channel is not available to start configuration recorder.
  me.startRecorder = function(input, callback) {

    params = {
      ConfigurationRecorderName: input.configRecorderName
    };
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.startConfigurationRecorder(params, callback);
      return;
    }

    var configService = me.preRun(self, input);
    configService.startConfigurationRecorder(params, me.callback);
  }
  // {}

  me.findChannelsStatus = function(input, callback) {

    params = {}
    if (input.deliveryChannelName)  params.DeliveryChannelNames = [input.deliveryChannelName];
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.describeDeliveryChannelStatus(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      if (data.DeliveryChannelsStatus[0]) {
        console.log('channel status is found');
        return data.DeliveryChannelsStatus[0];
      }
      else {
        console.log('channel status is not found');
        return null;
      }
    }

    self.addParams = function(found) {
      self.params.deliveryChannelName = found.name;
    }

    var configService = me.preRun(self, input);
    configService.describeDeliveryChannelStatus(params, me.callbackFind);
    // { DeliveryChannelsStatus:
    //     [ { configHistoryDeliveryInfo: {},
    //         configSnapshotDeliveryInfo: {},
    //         configStreamDeliveryInfo: {},
    //         name: 'default' } ] }
  }

  me.stopRecorder = function(input, callback) {

    params = {
      ConfigurationRecorderName: input.configRecorderName
    };
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.stopConfigurationRecorder(params, callback);
      return;
    }

    var configService = me.preRun(self, input);
    configService.stopConfigurationRecorder(params, me.callback);
  }
  // {}

  me.deleteChannel = function(input, callback) {

    var params = {
      DeliveryChannelName: input.deliveryChannelName
    };
    var self = arguments.callee;

    if (callback) {
      var configService = me.findService(input);
      configService.deleteDeliveryChannel(params, callback);
      return;
    }

    var configService = me.preRun(self, input);
    configService.deleteDeliveryChannel(params, me.callback);
  }
  // {}

    me.sendEvaluations = function(input, callback) {
        var params = {
                Evaluations: input.evaluations,
                ResultToken: input.resultToken
            };

        var self = arguments.callee;

        if (callback) {
            var configService = me.findService(input);
            configService.putEvaluations(params, callback);
            return;
        }

        self.callbackFind = function(data) {
            if(data.FailedEvaluations.length > 0) {
                // Ends the function execution if any evaluation results are not successfully reported.
                return JSON.stringify(data);
            } else {
                return data;
            }
        }

        var configService = me.preRun(self, input);
        console.log("params="+JSON.stringify(params));
        configService.putEvaluations(params, me.callbackFind);
    }
    // {}

    me.deleteRules = function(input) {
        var self = arguments.callee;
        var configService = me.findService(input);
        var params = {
            ConfigRuleName:input.ruleName
        };

        configService.deleteConfigRule(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log(data)
            }
        });
        return null;
    }
}

module.exports = AWSConfig
