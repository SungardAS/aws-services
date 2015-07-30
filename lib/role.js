
function AWSRole() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findRole = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM();
    params = {
      RoleName: input.roleName
    };
    iam.getRole(params, function(err, data) {
      if (err) {
        // console.log(err, err.stack);
        console.log("a role not found");
        fc.run_failure_function(me.findRole, input);
      }
      else {
        console.log("found a role");
        console.log(data);
        input.roleArn = data.Role.Arn;
        fc.run_success_function(me.findRole, input);
      }
    });
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
  }

  me.createRole = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM();
    console.log("Current path = " + __dirname);
    var fs = require("fs");
    data = fs.readFileSync(__dirname + '/json/' + input.assumeRolePolicyName + '.json', {encoding:'utf8'});
    console.log(data);
    var params = {
      AssumeRolePolicyDocument: data,
      RoleName: input.roleName
    };
    iam.createRole(params, function(err, data) {
      if (err) {
        console.log("Error in createRole : " + err, err.stack);
        fc.run_error_function(me.createRole, err);
      }
      else {
        console.log(data);
        console.log("successfully created a role : " + data.Role.Arn);
        input.roleArn = data.Role.Arn;
        fc.run_success_function(me.createRole, input);
      }
    });
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
  }

  me.findInlinePolicy = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM();
    var params = {
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };
   iam.getRolePolicy(params, function(err, data) {
      if (err) {
        //console.log(err, err.stack);
        console.log("an inline policy not found");
        fc.run_failure_function(me.findInlinePolicy, input);
      }
      else {
        console.log("found an inline policy");
        console.log(data);
        input.inlinePolicyDoc = JSON.parse(unescape(data.PolicyDocument));
        fc.run_success_function(me.findInlinePolicy, input);
      }
    });
    // { ResponseMetadata: { RequestId: '30625c2e-2cc5-11e5-bb8e-3f02a0601a52' },
    //   RoleName: 'alex-test-1',
    //   PolicyName: 'alex-test-policy-1',
    //   PolicyDocument: ' ...... '
    // }
  }

  me.createInlinePolicy = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM();
    console.log("Current path = " + __dirname);
    var fs = require("fs");
    data = fs.readFileSync(__dirname + '/json/' + input.inlinePolicyName + '.json', {encoding:'utf8'});
    console.log(data);
    var params = {
      PolicyDocument: data,
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };
    iam.putRolePolicy(params, function(err, data) {
      if (err) {
        console.log("Error in putRolePolicy : " + err, err.stack);
        fc.run_error_function(me.createInlinePolicy, err);
      }
      else {
        console.log("successfully created an inline policy");
        console.log(data);
        fc.run_success_function(me.createInlinePolicy, input);
      }
    });
    // { ResponseMetadata: { RequestId: 'd2d40361-2cc4-11e5-8d8c-6b42262cfdf3' } }
  }

  me.deleteInlinePolicy = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM();
    var params = {
      PolicyName: input.inlinePolicyName,
      RoleName: input.roleName
    };
    iam.deleteRolePolicy(params, function(err, data) {
      if (err) {
        console.log("Error in deleteRolePolicy : " + err, err.stack);
        fc.run_error_function(me.deleteInlinePolicy, err);
      }
      else {
        console.log("successfully deleted an inline policy");
        console.log(data);
        fc.run_success_function(me.deleteInlinePolicy, input);
       }
    });
  }

  me.deleteRole = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var iam = new AWS.IAM();
    var params = {
      RoleName: input.roleName
    };
    iam.deleteRole(params, function(err, data) {
      if (err) {
        console.log("Error in deleteRole : " + err, err.stack);
        fc.run_error_function(me.deleteRole, err);
      }
      else {
        console.log("successfully deleted a role");
        console.log(data);
        fc.run_success_function(me.deleteRole, input);
      }
    });
  }
}

module.exports = AWSRole
