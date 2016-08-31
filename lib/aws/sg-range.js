/**
 * Created by sonal.ojha on 7/18/2016.
 */
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
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

    me.sgInboundRulesHasPortRange = function(input, callback) {
        params = {}
        var self = arguments.callee;
        if (callback) {
            var ec2 = me.findService(input);
            ec2.describeSecurityGroups(params, callback);
            return;
        }

        self.callbackFind = function(data) {
            var hasRules = false;
            if (data.SecurityGroups.length !== 0) {
                for( var item in data.SecurityGroups) {
                    var permissions = data.SecurityGroups[item].IpPermissions;
                    console.log("11======permissions:"+permissions);
                    for ( var it in permissions) {
		      if(permissions[it].IpProtocol == "tcp"){
		         if(permissions[it].FromPort >=input.startPort && permissions[it].ToPort <=input.endPort ){
                            console.log("22======permissions:"+permissions[it].FromPort+":"+permissions[it].ToPort);
                            hasRules = true;
			    break;
			 }
			 if(permissions[it].FromPort >=input.fromPort && permissions[it].ToPort <=input.toPort ){
                            console.log("333======permissions:"+permissions[it].FromPort+":"+permissions[it].ToPort);
                            hasRules = true;
			    break;
			 }
                      }
                    }
                  if(hasRules){break;}
                }
                console.log("Not Found any Security group rules");
                console.log("======hasRules:"+hasRules);
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

