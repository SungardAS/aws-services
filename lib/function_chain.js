
function FunctionChain() {

  var me = this;

  me.run_success_function = function(func, input) {
    if (!input.functionChain)  return;
    var items = input.functionChain.filter(function(item) {
      return item.func == func;
    });
    //console.log(items);
    if (items[0] && items[0].success) items[0].success(input);
  }

  me.run_failure_function = function(func, input) {
    if (!input.functionChain)  return;
    var items = input.functionChain.filter(function(item) {
      return item.func == func;
    });
    //console.log(items);
    if (items[0] && items[0].failure) items[0].failure(input);
  }

  me.run_error_function = function(func, err) {
    if (!input.functionChain)  return;
    var items = input.functionChain.filter(function(item) {
      return item.func == func;
    });
    //console.log(items);
    if (items[0] && items[0].error) items[0].error(err);
  }
}

module.exports = FunctionChain
