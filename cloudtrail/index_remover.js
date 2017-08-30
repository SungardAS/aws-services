
exports.handler = function (event, context) {

  var aws_trail = new (require('../lib/aws/cloudtrail.js'))();
  var aws  = require("aws-sdk");

  var creds = new aws.Credentials({
    accessKeyId: event.creds.AccessKeyId,
    secretAccessKey: event.creds.SecretAccessKey,
    sessionToken: event.creds.SessionToken
  });



  var sessionName = event.sessionName;
  if (sessionName == null || sessionName == "") {
    sessionName = "session";
  }

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var input = {
    sessionName: sessionName,
    region: event.region,
    trailName: data_json.trailName,
    creds:creds
  };
  console.log(input);

  function succeeded(input) { context.done(null, true); }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_trail.findTrails, success:aws_trail.isLogging, failure:succeeded, error:errored},
    {func:aws_trail.isLogging, success:aws_trail.stopLogging, failure:aws_trail.deleteTrail, error:errored},
    {func:aws_trail.stopLogging, success:aws_trail.deleteTrail, failure:failed, error:errored},
    {func:aws_trail.deleteTrail, success:succeeded, failure:failed, error:errored},
  ];
  aws_trail.flows = flows;

  flows[0].func(input);
};
