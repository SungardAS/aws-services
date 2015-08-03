
function AWSConfig() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findRecorders = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {}
    //if (input.configRecorderName)  params.ConfigurationRecorderNames = [input.configRecorderName];
    configService.describeConfigurationRecorders(params, function (err, data) {
      if (err) {
        console.log("Error in describeConfigurationRecorders : " + err, err.stack);
        fc.run_error_function(me.findRecorders, err);
      }
      else {
        console.log(data);
        if (data.ConfigurationRecorders[0]) {
          console.log('found recorder(s)');
          input.configRecorderName = data.ConfigurationRecorders[0].name;
          /*if (data.ConfigurationRecorders[0].roleARN != input.roleArn) {
            // change the role
            console.log('the role is not same, so replace the role');
            fc.run_failure_function(me.findRecorders, input);
          }
          else {*/
            console.log('successfully found recorder(s)');
            fc.run_success_function(me.findRecorders, input);
          //}
        }
        else {
          console.log('no recorder(s) found');
          fc.run_failure_function(me.findRecorders, input);
        }
      }
    });
    // { ConfigurationRecorders:
    //     [ { name: 'default',
    //         recordingGroup: [Object],
    //         roleARN: 'arn:aws:iam::290093585298:role/lambda_config_setup_role' } ] }
  }

  me.setRoleInRecorder = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {
      ConfigurationRecorder: {
        name: input.configRecorderName,
        /*recordingGroup: {
          allSupported: true,
          resourceTypes: []
        },*/
        roleARN: input.roleArn
      }
    };
    //console.log(params);
    configService.putConfigurationRecorder(params, function(err, data) {
      if (err) {
        console.log("Error in putConfigurationRecorder : " + err, err.stack);
        fc.run_error_function(me.setRoleInRecorder, err);
      }
      else {
        console.log('successfully set a role in the recorder');
        fc.run_success_function(me.setRoleInRecorder, input);
       }
    });
  }

  me.findChannels = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {}
    //if (input.deliveryChannelName)  params.DeliveryChannelNames = [input.deliveryChannelName];
    configService.describeDeliveryChannels(params, function (err, data) {
      if (err) {
        console.log("Error in describeDeliveryChannels : " + err, err.stack);
        fc.run_error_function(me.findChannels, err);
      }
      else {
        console.log(data);
        if (data.DeliveryChannels[0]) {
          input.deliveryChannelName = data.DeliveryChannels[0].name;
          console.log('successfully found channel(s)');
          fc.run_success_function(me.findChannels, input);
        }
        else {
          console.log('no channel(s) found');
          fc.run_failure_function(me.findChannels, input);
        }
      }
    });
    // { DeliveryChannels:
    //     [ { name: 'default',
    //         s3BucketName: '290093585298.awsconfig',
    //         snsTopicARN: 'arn:aws:sns:us-west-2:290093585298:config-topic-temp' } ] }
  }

  me.setChannel = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {
      DeliveryChannel: {
        name: input.deliveryChannelName,
        s3BucketName: input.bucketName,
        s3KeyPrefix: null,
        snsTopicARN: input.topicArn
      }
    };
    configService.putDeliveryChannel(params, function(err, data) {
      if (err) {
        console.log("Error in putDeliveryChannel : " + err, err.stack);
        fc.run_error_function(me.setChannel, err);
      }
      else {
        console.log('successfully set a channel');
        fc.run_success_function(me.setChannel, input);
       }
    });
    // {}
  }

  me.findRecordersStatus = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {}
    if (input.configRecorderName)  params.ConfigurationRecorderNames = [input.configRecorderName];
    configService.describeConfigurationRecorderStatus(params, function (err, data) {
      if (err) {
        console.log("Error in describeConfigurationRecorderStatus : " + err, err.stack);
        fc.run_error_function(me.findRecordersStatus, err);
      }
      else {
        console.log(data);
        if (data.ConfigurationRecordersStatus[0]) {
          input.configRecorderName = data.ConfigurationRecordersStatus[0].name;
          if (data.ConfigurationRecordersStatus[0].recording) {
            console.log('recording is currently on');
            fc.run_success_function(me.findRecordersStatus, input);
          }
          else {
            console.log('recording is currently off');
            fc.run_failure_function(me.findRecordersStatus, input);
          }
        }
        else {
          console.log("No recorder status found in describeConfigurationRecorderStatus");
          fc.run_error_function(me.findRecordersStatus, err);
        }
      }
    });
    // { ConfigurationRecordersStatus:
    //     [ { lastStartTime: Mon Jul 13 2015 16:00:30 GMT-0400 (EDT),
    //         lastStatus: 'SUCCESS',
    //         lastStatusChangeTime: Fri Jul 17 2015 16:00:45 GMT-0400 (EDT),
    //         lastStopTime: Fri Jul 17 2015 17:25:14 GMT-0400 (EDT),
    //         name: 'default',
    //         recording: false } ] }
  }

  // The channels must be created first. We'll get below error if there is no channel.
  // 'NoAvailableDeliveryChannelException: Delivery channel is not available to start configuration recorder.
  me.startRecorder = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {
      ConfigurationRecorderName: input.configRecorderName
    };
    configService.startConfigurationRecorder(params, function(err, data) {
      if (err) {
        console.log("Error in startConfigurationRecorder : " + err, err.stack);
        fc.run_error_function(me.startRecorder, err);
      }
      else {
        console.log(data);
        console.log('successfully started a recorder');
        fc.run_success_function(me.startRecorder, input);
       }
    });
    // {}
  }

  me.findChannelsStatus = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    configService = new AWS.ConfigService({'region':input.region});
    params = {}
    if (input.deliveryChannelName)  params.DeliveryChannelNames = [input.deliveryChannelName];
    configService.describeDeliveryChannelStatus(params, function (err, data) {
      if (err) {
        console.log("Error in describeDeliveryChannelStatus : " + err, err.stack);
        fc.run_error_function(me.findChannelsStatus, err);
      }
      else {
        console.log(data);
        if (data.DeliveryChannelsStatus[0]) {
          input.deliveryChannelName = data.DeliveryChannelsStatus[0].name;
          console.log('channel status is found');
          fc.run_success_function(me.findChannelsStatus, input);
        }
        else {
          console.log('channel status is not found');
          fc.run_failure_function(me.findChannelsStatus, input);
        }
      }
    });
    // { DeliveryChannelsStatus:
    //     [ { configHistoryDeliveryInfo: {},
    //         configSnapshotDeliveryInfo: {},
    //         configStreamDeliveryInfo: {},
    //         name: 'default' } ] }
  }

  me.stopRecorder = function(input) {
    configService = new AWS.ConfigService({'region':input.region});
    params = {
      ConfigurationRecorderName: input.configRecorderName
    };
    configService.stopConfigurationRecorder(params, function(err, data) {
      if (err) {
        console.log("Error in stopConfigurationRecorder : " + err, err.stack);
        fc.run_error_function(me.stopRecorder, err);
      }
      else {
        console.log(data);
        console.log('successfully stopped a recorder');
        fc.run_success_function(me.stopRecorder, input);
       }
    });
    // {}
  }

  me.deleteChannel = function(input) {
    configService = new AWS.ConfigService({'region':input.region});
    var params = {
      DeliveryChannelName: input.deliveryChannelName
    };
    configService.deleteDeliveryChannel(params, function(err, data) {
      if (err) {
        console.log("Error in deleteDeliveryChannel : " + err, err.stack);
        fc.run_error_function(me.deleteChannel, err);
      }
      else {
        console.log(data);
        console.log('successfully deleted a channel');
        fc.run_success_function(me.deleteChannel, input);
      }
    });
    // {}
  }
}

module.exports = AWSConfig
