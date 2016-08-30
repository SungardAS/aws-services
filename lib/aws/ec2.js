/**
 * Created by sonal.ojha on 7/18/2016.
 */
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

const EVALUATION_TYPES = {
    COMPLAINT: 'COMPLIANT',
    NON_COMPLIANT: 'NON_COMPLIANT',
}

function AWSEC2() {

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

    me.securityGroupHasRules = function(input, callback) {
        params = {
            DryRun: false,
            Filters: [
                {
                    Name: 'group-name',
                    Values: [
                        input.groupName /* required */
                    ]
                }
            ]
        };
        if(input.vpcId){
            params.Filters.push({
                Name: 'vpc-id',
                Values: [
                    input.vpcId /* required */
                ]
            });
        }
        var self = arguments.callee;

        if (callback) {
            var ec2 = me.findService(input);
            ec2.describeSecurityGroups(params, callback);
            return;
        }

        self.getEvaluations = function(data){
            var annotation = "",
                complianceType = EVALUATION_TYPES.COMPLAINT,
                evaluations = [];

            for (var idx in data){
                var ingressPerm = rules[idx].IpPermissions,
                    egressPerm = rules[idx].IpPermissionsEgress,
                    vpcId = rules[idx].VpcId,
                    sgId = rules[idx].GroupId;

                console.log("=======Inbound Rules for VPC ["+ vpcId +"]=======");
                if (ingressPerm.length !==0){
                    annotation += "["+ ingressPerm.length +"] ingress rules present for vpc ["+ vpcId +"] \n";
                    complianceType = EVALUATION_TYPES.NON_COMPLIANT;
                }else{
                    annotation += "no ingress rules \n";
                }

                for(var i in ingressPerm){
                    console.log(ingressPerm[i]);
                }
                console.log("=======Outbound Rules for VPC ["+ vpcId +"]=======");
                if (egressPerm.length !==0){
                    annotation += "["+ egressPerm.length +"] egress rules present for vpc ["+ vpcId +"]";
                    complianceType = EVALUATION_TYPES.NON_COMPLIANT;
                }else{
                    annotation += "no egress rules";
                }

                for(var i in egressPerm){
                    console.log(egressPerm[i]);
                }
                //send evaluation for each vpc security group
                console.log("complianceType="+complianceType);
                evaluations.push({
                    ComplianceResourceType: "AWS::EC2::SecurityGroup",
                    ComplianceResourceId: sgId,
                    ComplianceType: complianceType,
                    OrderingTimestamp: input.timeStamp,
                    Annotation: annotation
                });
                complianceType = EVALUATION_TYPES.COMPLAINT;
                annotation = "";
            }
            return evaluations;
        }

        self.callbackFind = function(data) {
            return self.getEvaluations(data.SecurityGroups);
        }

        self.addParams = function(found) {
            self.params.evaluations = found;
        }

        var configService = me.preRun(self, input);
        configService.describeSecurityGroups(params, me.callbackFind);
    }
}

module.exports = AWSEC2

