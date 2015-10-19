
var aws_bucket = new (require('./aws/s3bucket.js'))();
var aws_lambda = new (require('./aws/lambda.js'))();

function LambdaCodeUpdator() {

  this.callback = callback;

  var me = this;

  function succeeded(input) {
    me.callback(null, true);
  }

  function failed(input) {
    me.callback(null, false);
  }

  function errored(err) {
    me.callback(err, null);
  }

  function callback(err, data) {
    if(err) console.log(err);
    else console.log(data);
  }

  me.update = function(input, callback) {
    if(callback)  me.callback = callback;
    // set 'functionName' from s3 keyName
    input.functionName = input.keyName.split('/')[1].split('.')[0];
    var flows = [
      {func:aws_bucket.findBucket, success:aws_lambda.findFunction, failure:failed, error:errored},
      {func:aws_lambda.findFunction, success:aws_lambda.updateFunctionCode, failure:failed, error:errored},
      {func:aws_lambda.updateFunctionCode, success:succeeded, failure:failed, error:errored},
    ];
    aws_bucket.flows = flows;
    aws_lambda.flows = flows;
    flows[0].func(input);
  }

  function buildInputParams(packageJSON) {
    var input = {
      region: packageJSON.region,
      bucketName: packageJSON.bucketName,
      keyName: packageJSON.keyName,
    };
    console.log(input);
    return input;
  }
}

module.exports = LambdaCodeUpdator
