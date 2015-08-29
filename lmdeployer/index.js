
exports.handler = function(event, context) {

  console.log('event : ' + JSON.stringify(event));

  region = event.Records[0].awsRegion;
  bucketName = event.Records[0].s3.bucket.name
  keyName = event.Records[0].s3.object.key
  versionId = event.Records[0].s3.object.versionId
  console.log('bucketName : ' + bucketName);
  console.log('keyName : ' + keyName);
  console.log('versionId : ' + versionId);

  var fs = require("fs");
  data = fs.readFileSync(__dirname + '/json/data.json', {encoding:'utf8'});
  data_json = JSON.parse(data);

  var bucketNamePostfix = data_json.bucketNamePostfix;
  if (bucketName.indexOf(bucketNamePostfix) < 0) {
    console.log("this bucket does NOT contain lambda files");
    context.succeed(null, true);
  }

  // find the function name
  var idx = keyName.indexOf('/');
  var zidx = keyName.indexOf('.zip');
  var functionName = keyName.substring(idx+1, zidx);
  if (functionName == 'lmdeployer') {
    console.log("This function is 'lmdeployer', so just return.");
    return;
  }
  console.log("uploaded to lambda function: " + functionName);

  var aws_lambda = new (require('../lib/aws/lambda.js'))();
  var input = {
    profile: (event.profile === undefined) ? null : event.profile,
    region: region,
    functionName: functionName,
    bucketName: bucketName,
    keyName: keyName
  };

  function succeeded(input) {
    console.log("function, '" + input.functionName + "', has been successfully updated");
    context.done(null, true);
  }
  function failed(input) { context.done(null, false); }
  function errored(err) { context.fail(err, null); }

  var flows = [
    {func:aws_lambda.findFunction, success:aws_lambda.updateFunctionCode, failure:failed, error:errored},
    {func:aws_lambda.updateFunctionCode, success:succeeded, failure:failed, error:errored},
  ];
  aws_lambda.flows = flows;
  flows[0].func(input);
};
