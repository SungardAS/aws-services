
exports.handler = function (event, context) {

    var aws_sts = new (require('../lib/aws/sts'))();
    var aws_ec2 = new (require('../lib/aws/ec2.js'))();

    if (!event.federateRoleName)  event.federateRoleName = "federate";

    var roles = [];
    if (event.federateAccount) {
        roles.push({roleArn:'arn:aws:iam::' + event.federateAccount + ':role/' + event.federateRoleName});
        var admin_role = {roleArn:'arn:aws:iam::' + event.account + ':role/' + event.roleName};
        if (event.roleExternalId) {
            admin_role.externalId = event.roleExternalId;
        }
        roles.push(admin_role);
    }
    console.log(roles);

    var sessionName = event.sessionName;
    if (sessionName == null || sessionName == "") {
        sessionName = "session";
    }

    var vpc_id = event.vpcId,
        region = event.region,
        group_name = event.groupName;

    var input = {
        sessionName: sessionName,
        roles: roles,
        vpcId: vpc_id,
        region: region,
        groupName: group_name
    };

    console.log("%%%%%%%%%%%%%%%%%%%%%% vpc_id=" + vpc_id);
    console.log("%%%%%%%%%%%%%%%%%%%%%% group_name=" + group_name);
    console.log("%%%%%%%%%%%%%%%%%%%%%% region=" + region);

    function succeeded(input) { context.done(null, true); }
    function failed(input) { context.done(null, false); }
    function errored(err) { context.fail(err, null); }

    var flows = [
        {func:aws_sts.assumeRoles, success:aws_ec2.securityGroupHasRules, failure:failed, error:errored},
        {func:aws_ec2.securityGroupHasRules, success:succeeded, failure:failed, error:errored}
    ];
    aws_ec2.flows = flows;

    flows[0].func(input);
};
