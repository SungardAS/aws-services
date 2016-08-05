/**
 * Created by sonal.ojha on 8/5/2016.
 */

var AWS = require('aws-sdk');

function LambdaFunctionRole() {

    var me = this;

    me.create = function(input, callback) {

        var params = {region: input.region};
        if (input.creds)  params.credentials = input.creds;
        var iam = new AWS.IAM(params);

        params = {
            PolicyDocument: input.policyDoc,
            PolicyName: input.policyName,
            Description: input.description
        };

        console.log(params);
        iam.createPolicy(params, function(err, data) {
            if (err) {
                console.log("Lammbda policy cannot be created");
                callback(err, null);
            }
            else {
                var policyArn = data.Policy.Arn;
                // create Role and attach the policy arn to the role
                params = {
                    AssumeRolePolicyDocument: input.assumeRolePolicyDocument,
                    RoleName: input.roleName
                };
                console.log(params);
                iam.createRole(params, function(err, data) {
                    if (err) {
                        console.log("Lammbda Role cannot be created");
                        callback(err, null);
                    }
                    else {
                        var roleName = data.Role.RoleName,
                            roleArn = data.Role.Arn;
                        params = {
                            RoleName: roleName,
                            PolicyArn: policyArn
                        };
                        console.log(params);
                        iam.attachRolePolicy(params, function(err, data) {
                            if (err) {
                                console.log("Cannot attach policy to the lambda role");
                                callback(err, null);
                            }
                            else {
                                callback(null, roleArn);
                            }
                        });
                    }
                });
            }
        });
    }

    me.build = function(action, packageJSON, callback) {
        var input = {
            region: packageJSON.Region,
            policyDoc: packageJSON.policyDocument,
            policyName: packageJSON.policyName,
            description: packageJSON.description,
            assumeRolePolicyDocument: packageJSON.assumeRolePolicyDocument,
            roleName: packageJSON.roleName
        };
        console.log(input);
        me[action](input, callback);
    }
}

module.exports = LambdaFunctionRole

