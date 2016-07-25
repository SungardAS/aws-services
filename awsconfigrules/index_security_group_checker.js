
exports.handler = function (event, context) {

    var aws_ec2 = new (require('../lib/aws/ec2.js'))();

    var vpc_id = event.vpc_id,
        region = event.region,
        group_name = event.group_name;

    var input = {
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
        {func:aws_ec2.securityGroupHasRules, success:succeeded, failure:failed, error:errored}
    ];
    aws_ec2.flows = flows;

    flows[0].func(input);
};
