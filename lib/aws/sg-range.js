/**
 * Created by sonal.ojha on 7/18/2016.
 */
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var aws_config = new (require('../aws/awsconfig.js'))()
var AWS = require('aws-sdk');

function AWSSG() {

    FlowController.call(this);

    var me = this;

    me.findService = function(input) {
        var params = {region:input.region};
        if (input.creds)  params.credentials = input.creds;
        else if (input.profile) {
            var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
            AWS.config.credentials = credentials;
        }
        var ec2 = new AWS.EC2(params);
        return ec2;
    }

    function isAnyIP(ips){
     for(var each in ips){
       if(ips[each].CidrIp == "0.0.0.0/0"){
           return "true";
        }
     }
           return "false";
   }

    me.sgInboundRulesHasPortRange = function(input, callback) {
        params = {}
        var self = arguments.callee;
        if (callback) {
            var ec2 = me.findService(input);
            ec2.describeSecurityGroups(params, callback);
            return;
        }

        self.callbackFind = function(data) {
            if (data.SecurityGroups.length !== 0) {
                for( var item in data.SecurityGroups) {
                    var hasRules = false;
                    var permissions = data.SecurityGroups[item].IpPermissions;
                    for ( var it in permissions) {
                      var res = isAnyIP(permissions[it].IpRanges);
                      console.log(permissions[it].IpRanges);
		      if((permissions[it].IpProtocol == "tcp") && (res == "true")){
                         console.log("1111111111");
                         console.log(res);
                         console.log(permissions[it].FromPort);
                         console.log(permissions[it].ToPort);
                         console.log(input.startPort);
                         console.log(input.endPort);
                         console.log("2222222222");
		         if(permissions[it].FromPort >=input.startPort && permissions[it].ToPort <=input.endPort ){
	
                            console.log("11haaaaaaaaaaaaaaa");
                            hasRules = true;
			    break;
			 }
			 if(permissions[it].FromPort >=input.fromPort && permissions[it].ToPort <=input.toPort ){
                            console.log("22haaaaaaaaaaaaaaa");
                            hasRules = true;
			    break;
			 }
                      }
                    }
                  input.hasRules=hasRules;
                  input.resourceId=data.SecurityGroups[item].GroupId;
                  aws_config.sendEvaluation(input);
                }
                console.log("start$$$$$$$$$$$hasRules:");
                console.log(hasRules);
                console.log("end$$$$hasRules:");
            }
            return hasRules;
        }
        self.addParams = function(found) {
            self.params.hasRules = found;
        }

        var configService = me.preRun(self, input);
        configService.describeSecurityGroups(params, me.callbackFind);
    }
}

module.exports = AWSSG

