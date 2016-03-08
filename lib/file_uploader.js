
var iam = new (require('./aws/role'))();
var zipper = new (require('./zipper/zipper'))();
var aws_bucket = new (require('./aws/s3bucket.js'))();
var aws_sts = new (require('./aws/sts'))();

function FileUploader() {

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

  me.upload = function(input, callback) {

    if(callback)  me.callback = callback;

    var flows = [
      {func:aws_sts.assumeRoles, success:aws_bucket.findBucket, failure:failed, error:errored},
      {func:aws_bucket.findBucket, success:zipper.zip, failure:aws_bucket.createBucket, error:errored},
      {func:aws_bucket.createBucket, success:zipper.zip, failure:failed, error:errored},
      {func:zipper.zip, success:aws_bucket.putObject, failure:failed, error:errored},
      {func:aws_bucket.putObject, success:succeeded, failure:failed, error:errored}
    ];
    aws_sts.flows = flows;
    aws_bucket.flows = flows;
    zipper.flows = flows;

    /*iam.findAccountId(input, function(err, data) {
      if (err) {
        errored('failed to find account id : ' + err);
      }
      else {
        // set the account id in the bucket name
        var splitted = input.bucketName.split('.');
        splitted[0] = data;
        input.bucketName = splitted.join('.');
        *var accountId = input.bucketName.split('.')[0];
        if (data != accountId) {
          console.log('Stopped uploading because the given account[' + accountId + '] is different from the current connected[' + data + ']');
          console.log('Please correct either account id of bucket name in package json file or authentication!');
          failed(input);
        }
        else {*/
          flows[0].func(input);
        //}
      //}
    //});
  }
}

module.exports = FileUploader
