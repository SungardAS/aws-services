
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSRole() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {};
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM(params);
    return iam;
  }

  me.createCredentials = function(input) {
    var creds = new AWS.Credentials({
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
      sessionToken: input.sessionToken
    });
    return creds;
  }

  me.findAccountId = function(input, callback) {

    params = {MaxItems: 1};

    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.listRoles(params, function(err, data) {
        if (err)  callback(err);
        else {
          if (data.Roles[0]) {
            callback(null, data.Roles[0].Arn.split(':')[4]);
          }
          else {
            callback("no role found");
          }
        }
      });
      return;
    }

    self.callbackFind = function(data) {
      if (data.Roles[0]) {
        console.log(data.Roles[0]);
        return data.Roles[0];
      }
      else {
        console.log("no role found");
        return null;
       }
    }

    self.addParams = function(data) {
      // 'arn:aws:iam::089476987273:role/awsconfig-setup-role'
      self.params.accountId = data.Arn.split(':')[4];
    }

    var iam = me.preRun(self, input);
    iam.listRoles(params, me.callbackFind);
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

  me.findRoleByPrefix = function(input, callback) {

    params = {};
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.listRoles(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      var roles = data.Roles.filter(function(role) {
        return (role.RoleName === input.roleName || role.RoleName.indexOf(input.roleName + "-") == 0);
      });
      console.log(roles);
      if (roles[0]) {
        console.log("found a role");
        console.log(roles[0]);
        return roles[0];
      }
      else {
        console.log("role whose name starts with '" + input.roleName + "' not found");
        return null;
       }
    }

    self.addParams = function(data) {
      self.params.roleArn = data.Arn;
      self.params.roleName = data.RoleName;
    }

    var iam = me.preRun(self, input);
    iam.listRoles(params, me.callbackFind);
  }

  me.createRole = function(input, callback) {

    /*console.log("Current path = " + __dirname);
    var fs = require("fs");
    data = fs.readFileSync(__dirname + '/json/' + input.assumeRolePolicyName + '.json', {encoding:'utf8'});
    console.log(data);
    var params = {
      AssumeRolePolicyDocument: data,
      RoleName: input.roleName
    };*/
    var roleName = input.roleName;
    if (input.roleNamePostfix)  roleName += "-" + input.roleNamePostfix;
    var params = {
      AssumeRolePolicyDocument: input.assumeRolePolicyDocument,
      RoleName: roleName
    };
    var self = arguments.callee;

    if (callback) {
      var iam = me.findService(input);
      iam.createRole(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.roleName = roleName;
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
