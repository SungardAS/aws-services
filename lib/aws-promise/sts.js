
var inherits = require('util').inherits;
var AWS = require('aws-sdk');

function AWSSecurityTokenService() {


    var me = this;

    me.findService = function(input) {
        var sts = new AWS.STS();
        return sts;
    }

    me.assumeRoles = function(input) {
        return new Promise(function(resolve,reject) {
    
            //console.log(input);
            profile = input.profile;
            roles = input.roles;
            sessionName = input.sessionName;
    
            if (!input.roles || input.roles.length == 0) {
                return;
            }
    
            if (profile) {
                sts = new AWS.STS();
                params = {};
                var stsPromise =  sts.getSessionToken(params).promise();
                stsPromise.then( function(data) {
                    console.log("Successfully created a session token");
                    var creds = new AWS.Credentials({
                        accessKeyId: data.Credentials.AccessKeyId,
                        secretAccessKey: data.Credentials.SecretAccessKey,
                        sessionToken: data.Credentials.SessionToken
                    });
                    var assumeRolePromise = assumeRole(creds, 0, roles, sessionName, input)
                    assumeRolePromise.then ( function(data) {
                        return resolve(data); 
                    });
                }).catch (function(err) {
                    console.log(err);
                });
            }
            else {
                console.log(input);
                var assumeRolePromise = assumeRole(null, 0, roles, sessionName, input);
                assumeRolePromise.then (function(data) {
                    console.log(data);
                    return resolve(data); 
                });
            }
        });
    }

    function assumeRole(creds, idx, roles, sessionName, input) {
        return new Promise(function(resolve,reject) {
            console.log('\n');
            role = roles[idx];
            var params = {};
            if (creds)  params.credentials = creds;
            var sts = new AWS.STS(params);
            var params = {
                RoleArn: role.roleArn,
                RoleSessionName: sessionName
            }
            console.log(input);
            console.log ("Role ARN == " + role.roleArn);
            if (role.externalId)  params.ExternalId = role.externalId;
            var awsAssumeRolePromise = sts.assumeRole(params).promise();
            awsAssumeRolePromise.then(function(data) {
                console.log("successfully assumed role, '" + role.roleArn + "'");
                //console.log(data);
                creds = new AWS.Credentials({
                    accessKeyId: data.Credentials.AccessKeyId,
                    secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
                });
                if (++idx == roles.length) {
                    console.log("\nsuccessfully completed to assume all roles");
                    //input.creds = creds;
                    resolve(creds);
                }
                else {
                    var assumeRolePromise = assumeRole(creds, idx, roles, sessionName, input);
                    assumeRolePromise.then(function(data) {
                        resolve(data);
                    });
                }
            }).catch(function(err) {
                console.log("error in assume role");
                console.log(err, err.stack);
            });
        });
    }
}
module.exports = AWSSecurityTokenService

