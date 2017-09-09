var AWS = require('aws-sdk');

function filterVmDetail(options, vmtype){
    return new Promise(function(resolve) {
        var vm_lst = "";
        for (var i = 0; i < options.Reservations.length; i++) {
           var res = options.Reservations[i];
           var instances = res.Instances;
           var status="";
           var tagName = "";
           var instanceid = "";
           for(var j=0; j< instances.length;j++){
              var vms = instances[j].Tags;
              var tags = instances[j].Tags;
              for (var k = 0; k < tags.length; k++) {
                 if(tags[k].Key == 'Name'){
                    var tagName = tags[k].Value;
                 }
              }
              status = instances[j].State.Name;
              instanceid = instances[j].InstanceId;
           }
        
        if(vmtype == "GetAllVms"){  
          var  vm_lst = vm_lst + instanceid +" | "+tagName +" | "+status+"\n";
        } else if (vmtype == "GetRunningVms"){
            if (status =="running") {
               var  vm_lst = vm_lst +instanceid +" | "+tagName +" | "+status+"\n";
            }
        } else if (vmtype == "GetStoppedVms"){
            if (status =="stopped") {
               var  vm_lst = vm_lst +instanceid +" | "+tagName +" | "+status+"\n";
            }
        } else {
            var  vm_lst = "Sorry no any vms";
        }
    }
    if(vm_lst =="") vm_lst = "Sorry, not found any vms in this state";
	resolve(vm_lst);
    });
}
function close(message) {
    return {
        dialogAction: {
            type: 'Close',
            "fulfillmentState":"Fulfilled",
            "message": {
               "contentType": "PlainText",
               //"content": JSON.stringify(message)
               "content": message
             }
        }
    };
}
//--------------------------------------------------------------------------------

var findManagedInstances = function(options,filter, cb) {
   var ec2 = getEc2Object(options);
    return ec2.describeInstances(filter, function(err, data){
        if (err){
            sails.log.error("Error while getting list of managed os:", err);
            cb(err, null);
        }else{
            cb(null, data)
        }
    });
};
//--------------------------------------------------------------------------------
function getManagedVmList(options, params){
    return new Promise(function(resolve,reject) {
        findManagedInstances(options, params, function(err, resp) {
            if (err) {
                sails.log.error("Error While fetching vm list : " + err);
                reject(err);
            }
            else{
                resolve(resp);
            }
        });
    });
}
//--------------------------------------------------------------------------------
var getEc2Object = function(options){
    params = {}
    params.credentials = options.creds;
    params.region = options.region;
    var ec2 = new AWS.EC2(params);
    return ec2;
}
//--------------------------------------------------------------------------------
exports.handler = function(event, context, callback ) {
    console.log(event)
    //callback(null,close("hi"));
    
    //var slackClient = require('@slack/client').WebClient;
    //var token = "179612938499.237807534550";
    var aws_sts = new (require('../lib/aws-promise/sts.js'))();
    if (!event.federateRoleName)  event.federateRoleName = "federate";
    if (!event.federateAccount)  event.federateAccount = "442294194136";
    if (!event.account)  event.account = event.currentIntent.slots.Account;
    if (!event.region)  event.region = "us-east-1"
    if (!event.roleName)  event.roleName = "sgas_admin";
    var action = event.currentIntent.name;

    var roles = [];
    if (event.federateAccount) {
        roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/' + event.federateRoleName});
        var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
        roles.push(admin_role);
    }
    console.log(roles);

    var input = {
        region: event.region,
        roles:roles
    };

    var stsAssumeRolePromise = aws_sts.assumeRolesByLambda(input);
    stsAssumeRolePromise.then(function (data) {
        input.creds = data;
        input.region = event.currentIntent.slots.region;
        return getManagedVmList(input,{})
    }).then(function(data) {
        console.log(data)
        return filterVmDetail(data,action)
	
    }).then(function(data) {
        console.log(data)
	callback(null,close(data));
    }).catch( function (err) {
        console.log("error is " + err);
        callback(null,close("Sorry, We don't have access to this account or region"));
    });
};
//--------------------------------------------------------------------------------

