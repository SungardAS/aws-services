var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSIAM(){

    var me = this;
    gUsersWithPolicies = [];
    gUserNames = [];

    var iam  = new AWS.IAM();
    
    params = {};
    
    var inlinePolicyFunction = function(name) {
        console.log("inlinePolicyFunction called");
        params = {
            UserName: name
        };
        
        return (iam.listUserPolicies(params).promise());
    };
    
    var attachedPolicyFunction = function(name) {
        console.log("attachedPolicyFunction called");
         params = {
            UserName: name
        };
        
        return (iam.listAttachedUserPolicies(params).promise());
    };
    

   var me.getUsersWithPolicy = function(input) { 
        var iamUsersPromise = iam.listUsers(params).promise();
        iamUsersPromise.then(function(data) {
            console.log("inside block1 ....data ==  " + data);
            if (data.Users.length !== 0) {
                console.log ("Users : " + data.Users);
                for( var user in data.Users) {
                    var userName = data.Users[user].UserName;
                    gUserNames.push(userName);
                }
            }
            return Promise.all(gUserNames.map(attachedPolicyFunction));
        }).then (function(data) {
            console.log("Inside block 2 data == " + data);
            var usersWithPolicies = [];
            for (var idx in data) {
                if (data[idx].AttachedPolicies.length > 0 ) {
                    gUsersWithPolicies.push(gUserNames[idx]);
                }
             }
             return gUsersWithPolicies;
        }).then (function(data) {
            return Promise.all(gUserNames.map(inlinePolicyFunction));
        }).then (function(data) {
            for (var idx in data) {
                if (data[idx].PolicyNames.length > 0 ) {
                    gUsersWithPolicies.push(gUserNames[idx]);
                }
             }
             console.log("userswithPolices ==  " + gUsersWithPolicies);
        }).catch(function(err) {
            console.log("Error occurred: ");
            console.log(err);
        });
        console.log("global users == " + gUsersWithPolicies);
        console.log(gUsersWithPolicies);
        return gUsersWithPolicies;
    }
}
module.exports = AWSIAM
