
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSRole() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {};
    if (input.creds)  params.credentials = input.creds;
    var iam = new AWS.IAM(params);
    return iam;
  }

  me.findRole = function(input, callback) {

    params = {
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.getRole(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.roleArn = data.Role.Arn;
    }

    var iam = me.preRun(self, input);
    iam.getRole(params, me.callbackFindOne);
  }
  // { ResponseMetadata: { RequestId: '6562e648-2cae-11e5-8432-bb09826449fe' },
  //    Role:
  //     { Path: '/',
  //       RoleName: 'alex-test-1',
  //       RoleId: 'AROAIP5JMZK4ARCTJFOQK',
  //       Arn: 'arn:aws:iam::290093585298:role/alex-test-1',
  //       CreateDate: Fri Jul 17 2015 12:43:32 GMT-0400 (EDT),
  //       AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Sid%22%3A%22%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Service%22%3A%22config.amazonaws.com%22%7D%2C%22Action%22%3A%22sts%3AAssumeRole%22%7D%5D%7D'
  //      }
  //   }

  me.createRole = function(input, callback) {

    /*console.log("Current path = " + __dirname);
    var fs = require("fs");
    data = fs.readFileSync(__dirname + '/json/' + input.assumeRolePolicyName + '.json', {encoding:'utf8'});
    console.log(data);
    var params = {
      AssumeRolePolicyDocument: data,
      RoleName: input.roleName
    };*/
    var params = {
      AssumeRolePolicyDocument: input.assumeRolePolicyDocument,
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.createRole(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.roleArn = data.Role.Arn;
    }

    var iam = me.preRun(self, input);
    iam.createRole(params, me.callback);
  }
  // { ResponseMetadata: { RequestId: 'f5da8136-2ca2-11e5-a835-bd6b7e4f7ea3' },
  //Role:
  // { Path: '/',
  //   RoleName: 'alex-test-1',
  //   RoleId: 'AROAIP5JMZK4ARCTJFOQK',
  //   Arn: 'arn:aws:iam::290093585298:role/alex-test-1',
  //   CreateDate: Fri Jul 17 2015 12:43:32 GMT-0400 (EDT),
  //   AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Sid%22%3A%22%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Service%22%3A%22config.amazonaws.com%22%7D%2C%22Action%22%3A%22sts%3AAssumeRole%22%7D%5D%7D'
  //  }
  // }

  me.findInlinePolicy = function(input, callback) {

    var params = {
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.getRolePolicy(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.inlinePolicyDoc = JSON.parse(unescape(data.PolicyDocument));
    }

    var iam = me.preRun(self, input);
    iam.getRolePolicy(params, me.callbackFindOne);
  }
  // { ResponseMetadata: { RequestId: '30625c2e-2cc5-11e5-bb8e-3f02a0601a52' },
  //   RoleName: 'alex-test-1',
  //   PolicyName: 'alex-test-policy-1',
  //   PolicyDocument: ' ...... '
  // }

  me.createInlinePolicy = function(input, callback) {

    /*console.log("Current path = " + __dirname);
    var fs = require("fs");
    data = fs.readFileSync(__dirname + '/json/' + input.inlinePolicyName + '.json', {encoding:'utf8'});
    console.log(data);
    var params = {
      PolicyDocument: data,
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };*/
    var params = {
      PolicyDocument: input.inlinePolicyDocument,
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.putRolePolicy(params, callback);
      return;
    }

    var iam = me.preRun(self, input);
    iam.putRolePolicy(params, me.callback);
  }
  // { ResponseMetadata: { RequestId: 'd2d40361-2cc4-11e5-8d8c-6b42262cfdf3' } }

  me.deleteInlinePolicy = function(input, callback) {

    var params = {
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.deleteRolePolicy(params, callback);
      return;
    }

    var iam = me.preRun(self, input);
    iam.deleteRolePolicy(params, me.callback);
  }

  me.deleteRole = function(input, callback) {

    var params = {
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.deleteRole(params, callback);
      return;
    }

    var iam = me.preRun(self, input);
    iam.deleteRole(params, me.callback);
  }

  me.updateAssumeRolePolicy = function(input, callback) {

    var params = {
      PolicyDocument: input.policyDocument,
      RoleName: input.roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.updateAssumeRolePolicy(params, callback);
      return;
    }

    var iam = me.preRun(self, input);
    iam.updateAssumeRolePolicy(params, me.callback);
  }
}

module.exports = AWSRole
