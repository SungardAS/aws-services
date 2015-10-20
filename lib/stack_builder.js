
var stack = new (require('./aws/stack.js'))();

function StackBuilder() {

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

  function isCreateSucceeded(input) {
    if (input.status == "CREATE_COMPLETE")  succeeded(input);
    failed(input);
  }

  function isDeleteSucceeded(input) {
    if (input.status == "DELETE_COMPLETE")  succeeded(input);
    failed(input);
  }

  me.launch = function(input, callback) {

    if(callback)  me.callback = callback;

    var flows = [
      {func:stack.findStack, success:stack.waitForComplete, failure:stack.createStack, error:errored},
      {func:stack.createStack, success:stack.waitForComplete, failure:failed, error:errored},
      {func:stack.waitForComplete, success:isCreateSucceeded, failure:failed, error:errored},
    ];
    stack.flows = flows;

    flows[0].func(input);
  }

  me.drop = function(input, callback) {

    if(callback)  me.callback = callback;

    var flows = [
      {func:stack.findStack, success:stack.deleteStack, failure:succeeded, error:errored},
      {func:stack.deleteStack, success:stack.waitForComplete, failure:failed, error:errored},
      {func:stack.waitForComplete, success:isDeleteSucceeded, failure:succeeded, error:errored},
    ];
    stack.flows = flows;

    flows[0].func(input);
  }
}

module.exports = StackBuilder
