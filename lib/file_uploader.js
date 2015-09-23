
var zipper = new (require('./zipper/zipper'))();
var aws_bucket = new (require('./aws/s3bucket.js'))();
var aws_sts = new (require('./aws/sts'))();

function FileUploader() {

  var me = this;

  function succeeded() {
    console.log("Successfully completed!!");
  }

  me.upload = function(input, callback) {
    if(!callback) callback = succeeded;
    var flows = [
      {func:aws_sts.assumeRoles, success:aws_bucket.findBucket},
      {func:aws_bucket.findBucket, success:zipper.zip},
      {func:zipper.zip, success:aws_bucket.putObject},
      {func:aws_bucket.putObject, success:callback}
    ];
    aws_sts.flows = flows;
    aws_bucket.flows = flows;
    zipper.flows = flows;

    flows[0].func(input);
  }
}

module.exports = FileUploader
