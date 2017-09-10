var AWS = require('aws-sdk');

//--------------------------------------------------------------------------------
function filterVmDetail(data){
    return new Promise(function(resolve) {
        var vm_lst = "";
        for (var i = 0; i < data.InstanceStatuses.length; i++) {
          vm_lst= vm_lst + JSON.stringify(data.InstanceStatuses[i].SystemStatus);
          vm_lst= vm_lst + JSON.stringify(data.InstanceStatuses[i].InstanceStatus);
        }
    
    if(vm_lst =="") vm_lst = "Sorry, not found any vms in this state";
	resolve(vm_lst);
    });
}
//--------------------------------------------------------------------------------
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
    console.log(filter)
    return ec2.describeInstanceStatus(filter, function(err, data){
        if (err){
            //sails.log.error("Error while getting list of managed os:", err);
            console.log(err);
            cb(null,err);
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
                console.log(err);
                //reject(err);
                resolve(err)
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
    var aws_sts = new (require('../lib/aws-promise/sts.js'))();
    if (!event.federateRoleName)  event.federateRoleName = "federate";
    if (!event.federateAccount)  event.federateAccount = "442294194136";
    if (!event.account)  event.account = event.currentIntent.slots.Account;
    if (!event.region)  event.region = "us-east-1"
    if (!event.roleName)  event.roleName = "sgas_admin";
    //var action = event.currentIntent.name;
    var instanceIds = event.currentIntent.slots.instanceIds;

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
        var params = {IncludeAllInstances: true}
        if(instanceIds != "all"){
          instanceIds = instanceIds.split(",");
          params.InstanceIds=instanceIds;
          
        }
        return getManagedVmList(input,params)
    }).then(function(data) {
        console.log(data)
        return filterVmDetail(data)
	
    }).then(function(data) {
        console.log(data)
	callback(null,close(data));
    }).catch( function (err) {
        console.log("error is " + err);
        callback(null,close("Sorry, We don't have access to this instanceID"));
    });
};
//--------------------------------------------------------------------------------


