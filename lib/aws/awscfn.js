
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSCfn() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.CloudFormation.credentials = credentials;
    }
    //var cfnService = new AWS.ConfigService(params);
    var cfnService = new AWS.CloudFormation(params);
    return cfnService;
  }


  me.createESnapShotCFNStack = function(input, callback) {

    var self = arguments.callee;
    var cnfparam = {
        //StackName: 'snapshotTool',
        StackName: input.stackName,
        Capabilities: ['CAPABILITY_IAM'],
        OnFailure: 'ROLLBACK',
        Parameters: [
           {
              ParameterKey: "KeyName",
              ParameterValue: input.params.KeyName
           },
           {
              ParameterKey: "ImageId",
              ParameterValue: input.Ami
           },
           {
              ParameterKey: "EIP",
              ParameterValue: input.params.Eip
           },
           {
              ParameterKey: "NameTag",
              ParameterValue: input.params.NameTag
           },
           {
              ParameterKey: "SourceCIDR",
              ParameterValue: input.params.SourceCIDR
           },
           {
              ParameterKey: "SshLocation",
              ParameterValue: input.params.SshLocation
           },
           {
              ParameterKey: "SubnetId",
              ParameterValue: input.params.SubnetId
           },
           {
              ParameterKey: "VolumeIOps",
              ParameterValue: input.params.VolumeIOps
           },
           {
              ParameterKey: "VolumeSize",
              ParameterValue: input.params.VolumeSize
           },
           {
              ParameterKey: "VpcId",
              ParameterValue: input.params.VpcId
           },
           {
              ParameterKey: "UUID",
              ParameterValue: input.params.UUID
           }
         ],
        TemplateURL: input.s3Url //'https://s3-us-west-1.amazonaws.com/temporary-management/ESSTool--ireland.json',
    };

    var cfnService = me.findService(input);
    if (callback) {
       var cfnService = me.findService(input);
       cfnService.createStack(cnfparam, callback);
       return;
   }
   self.callbackFind = function(data) {
       return data;
   }
   self.addParams = function(found) {
       self.params.res = found;
   }
   var cfnService = me.preRun(self, input);
   cfnService.createStack(cnfparam, me.callbackFind);
  }

  me.getStackStatus = function(input, callback) {

    var cfnparam = {
      StackName: input.stackName
    };
    console.log(cfnparam);
    var self = arguments.callee;
    if (callback) {
      var cloudformation = me.findService(input);
      cloudformation.describeStacks(cfnparam, callback);
      return;
    }
   self.callbackFind = function(data) {
       return data;
   }
    self.addParams = function(data) {
      console.log("Result From Response:");
      console.log(data);
      self.params.res = data.Stacks[0].StackStatus
    }
    var cloudformation = me.preRun(self, input);
    cloudformation.describeStacks(cfnparam, me.callbackFind);
  }
  me.deleteStack = function(input, callback) {

    var cfnparam = {
      StackName: input.stackName
    };
    console.log(cfnparam);
    var self = arguments.callee;
    if (callback) {
      var cloudformation = me.findService(input);
      cloudformation.deleteStack(cfnparam, callback);
      return;
    }
   self.callbackFind = function(data) {
       return data;
   }
    self.addParams = function(data) {
      console.log("Result From Response:");
      console.log(data);
      self.params.res = data;
    }
    var cloudformation = me.preRun(self, input);
    cloudformation.deleteStack(cfnparam, me.callbackFind);
  }

}

module.exports = AWSCfn
