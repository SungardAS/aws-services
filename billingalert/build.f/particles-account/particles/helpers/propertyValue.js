module.exports = function(str,options) {
  if ((str != null) && (typeof str != 'object') && (str.indexOf('{') != 0)) {
    return '"'+str+'"';
  } else {
    return str;
  }
};
