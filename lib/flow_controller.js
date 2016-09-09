
function FlowController() {

  this.flows = null;
  var me = this;

  me.findFunctionName = function(func) {
    var names = Object.keys(me).filter(function(key){if(me[key] == func) return key});
    if (names[0]) return names[0];
    return '';
  }

  me.preRun = function(func, input) {
    console.log("\n<<<Starting " + me.findFunctionName(func) + "...")
    service = me.findService(input);
    me.findFlow(func);
    func.params = input;
    me.currentFunction = func;
    return service;
  }

  me.findFlow = function(func) {
    if (!me.flows)  return;
    var found = me.flows.filter(function(flow) {
      return flow.func == func;
    });
    //console.log(items);
    if (found[0]) {
      func.flow = found[0];
    }
    else {
      func.flow = null;
    }
  }

  me.wait = function(params) {
    var self = arguments.callee;
    me.preRun(self, params);
    setTimeout(function() {
      //console.log(me.currentFunction.flow.success.toString());
      me.succeeded(params);
    }, 10*1000);
  }

  me.succeeded = function(params) {
    var func = me.currentFunction;
    if (func.flow && func.flow.success) func.flow.success(params);
  }

  me.failed = function(params) {
    var func = me.currentFunction;
    if (func.flow && func.flow.failure) func.flow.failure(params);
  }

  me.errored = function(err) {
    var func = me.currentFunction;
    if (func.flow && func.flow.error) func.flow.error(err);
  }

  me.callback = function(err, data) {
    var func = me.currentFunction;
    var fname = me.findFunctionName(func);
    if (err) {
      console.log(">>>Error in " + fname + " : " + err, err.stack);
      me.errored(err);
    }
    else {
      //console.log(data);
      if(func.addParams)  func.addParams(data);
      console.log(">>>..." + fname + " completed")
      me.succeeded(func.params);
    }
  }

  me.callbackFindOne = function(err, data) {
    var func = me.currentFunction;
    var fname = me.findFunctionName(func);
    //console.log(func.flow);
    if (err) {
      console.log(">>>..." + fname + " : not found : " + err);
      me.failed(func.params);
    }
    else {
      //console.log(data);
      if(func.addParams)  func.addParams(data);
      console.log(">>>..." + fname + " : found")
      me.succeeded(func.params);
    }
  }

  me.callbackFind = function(err, data) {
    var func = me.currentFunction;
    var fname = me.findFunctionName(func);
    //console.log(func.flow);
    if (err) {
      console.log(">>>Error in " + fname + " : " + err, err.stack);
      me.errored(err);
    }
    else {
      //console.log(data);
      var found = func.callbackFind(data);
      if (found) {
        if(func.addParams)  func.addParams(found);
        console.log(">>>..." + fname + " : found")
        me.succeeded(func.params);
      }
      else {
        console.log(">>>..." + fname + " : not found")
        me.failed(func.params);
      }
    }
  }

  me.callbackBoolean = function(err, data) {
    var func = me.currentFunction;
    var fname = me.findFunctionName(func);
    //console.log(func.flow);
    if (err) {
      console.log(">>>Error in " + fname + " : " + err, err.stack);
      me.errored(err);
    }
    else {
      //console.log(data);
      var bool = func.callbackBoolean(data);
      if (bool) {
        if(func.addParams)  func.addParams(data);
        console.log(">>>..." + fname + " : true")
        me.succeeded(func.params);
      }
      else {
        console.log(">>>..." + fname + " : false")
        me.failed(func.params);
      }
    }
  }
}

module.exports = FlowController
