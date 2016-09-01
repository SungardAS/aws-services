/**
 * Created by sonal.ojha on 7/18/2016.
 */
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var aws_config = new (require('../aws/awsconfig.js'))()
var AWS = require('aws-sdk');

const EVALUATION_TYPES = {
    COMPLAINT: 'COMPLIANT',
    NON_COMPLIANT: 'NON_COMPLIANT',
}
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
              return true;
          }
       } 
       return false;
    }

    function getEvaluationParam(st, sgId, input) {
       var eval = [];
       complianceType= EVALUATION_TYPES.NON_COMPLIANT
       if(st){
          complianceType= EVALUATION_TYPES.COMPLAINT 
       }
       eval.push({
           ComplianceResourceType: input.resourceType,
           ComplianceResourceId: sgId,
           ComplianceType: complianceType,
           OrderingTimestamp: input.timeStamp,
       });
       return eval;
    }

    function range(start, end) {
       var foo = [];
       for (var i = start; i <= end; i++) {
          foo.push(i);
       }
       return foo;
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
                    var hasRules = true;
                    var permissions = data.SecurityGroups[item].IpPermissions;
                    for ( var it in permissions) {
                      var res = isAnyIP(permissions[it].IpRanges);
                      console.log(permissions[it].IpRanges);
		      if((permissions[it].IpProtocol == "tcp") && (res)){
                         ports = range(permissions[it].FromPort,permissions[it].ToPort);
                         p_st = false;
                         for(var each in ports){
			    if(ports[each] >= input.startPort && ports[each] <= input.endPort){
                               p_st = true;
			       break
                            }
                         }
                         if(p_st){hasRules=false;break;}
                      }
                    }
                  input.evaluations=getEvaluationParam(hasRules, data.SecurityGroups[item].GroupId, input);
                  aws_config.sendEvaluations(input);
                }
            }
            //return hasRules;
        }
        self.addParams = function(found) {
            self.params.hasRules = found;
        }

        var configService = me.preRun(self, input);
        configService.describeSecurityGroups(params, me.callbackFind);
    }
}

module.exports = AWSSG

