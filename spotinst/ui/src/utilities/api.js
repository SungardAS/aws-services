'use strict';

import GLOBAL from './global';

var Api = {

  get_api_url : function() {
    return GLOBAL.apiUrl;
  },

  get_msaws_api_url : function() {
    return GLOBAL.msawsApiUrl;
  },

  get_price_api_url : function() {
    return GLOBAL.pricerApiUrl;
  },

  send_request: function (url, method, data, refresh_token) {
    const self = this;
    if (data) {
      data = JSON.stringify(data);
    }
    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest();
      request.open(method || 'GET', url);
      request.setRequestHeader('Content-Type', 'application/json');
      //request.setRequestHeader('x-api-key', '');
      if (refresh_token)  request.setRequestHeader('refresh_token', refresh_token);
      request.onload = function () {
        if (request.status >= 200 && request.status < 300) {
           var data = 'response' in request ? request.response : request.responseText;
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            console.error(e);
            reject(e);
          }
        } else {
          reject(request.response);
        }
      };
      request.onerror = function () {
        alert(request.status);
        reject(request.status);
      };
      if (data) {
        request.send(data);
      } else {
        request.send();
      }
    });
  }
};

export default Api;
