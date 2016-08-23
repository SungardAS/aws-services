/**
 * Created by sonal.ojha on 7/18/2016.
 */
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

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
            params.Filters.append({
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

        self.callbackFind = function(data) {
            return data.SecurityGroups;
        }

        self.addParams = function(found) {
            self.params.rules = found;
        }

        var configService = me.preRun(self, input);
        configService.describeSecurityGroups(params, me.callbackFind);
    }
}

module.exports = AWSEC2

