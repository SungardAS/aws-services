var inherits = require('util').inherits;
var AWS = require('aws-sdk');

function AWSIAM(){

    var me = this;

    global.iam;

    var inlinePolicyFunction = function(user) {
        params = {
            UserName: user.UserName
        };
        
        return (global.iam.listUserPolicies(params).promise());
    };
    
    var attachedPolicyFunction = function(user) {
         params = {
            UserName: user.UserName
        };
        
        return (global.iam.listAttachedUserPolicies(params).promise());
    };
    

    me.getUsersWithPolicies = function(creds) { 
        return new Promise(function(resolve,reject) {
            var params = {};
            var users = [];
            var usersWithPolicies = {};
            params.credentials = creds;
            global.iam = new AWS.IAM(params);
            var iamUsersPromise = global.iam.listUsers({}).promise();
            iamUsersPromise.then(function(data) {
                if (data.Users.length !== 0) {
                    console.log ("Users : " + data.Users);
                    users = data.Users;
                }
                return Promise.all(users.map(attachedPolicyFunction));
            }).then (function(attachedPolicies) {
                var userId;
                for (var idx in attachedPolicies) {
                    userId = users[idx].UserId;
                    if (attachedPolicies[idx].AttachedPolicies.length > 0 ) {
                        usersWithPolicies[userId] = true;
                    }
                    else {
                        usersWithPolicies[userId] = false;
                    }
                }
            }).then (function() {
                return Promise.all(users.map(inlinePolicyFunction));
            }).then (function(inlinePolicies) {
                var userId;
                for (var idx in inlinePolicies) {
                    userId = users[idx].UserId;
                    if (inlinePolicies[idx].PolicyNames.length > 0 ) {
                        usersWithPolicies[userId] = true;
                    }
                 }
                 console.log("usersWithPolicies = " );
                 console.log(usersWithPolicies);
                 resolve(usersWithPolicies);
            }).catch(function(err) {
                console.log("Error occurred: ");
                console.log(err);
                reject(err);
            });
        });
    }
}
module.exports = AWSIAM
