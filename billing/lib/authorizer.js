
var Q = require("q")
var http = require("http");
var url = require("url");
var querystring = require('querystring');

var ssoUrl = "http://dev-api-s-ssoproxy-jwh01ro707fy-1804377264.us-east-1.elb.amazonaws.com";

module.exports = {

  authenticate: function(username, password) {
    var urlPath = ssoUrl + "/auth";
    var method = "POST";
    var payload = {
      username: username,
      password: password
    }
    return this.sendRequestPromise(urlPath, method, payload);
    // {"scope":"phone email address cloud openid profile","expires_in":59,"token_type":"Bearer","refresh_token":"5f09be0f-562d-481f-aa78-862977fb980f","id_token":"eyAidHlwIjogIkpXVCIsICJhbGci...","access_token":"fc8a07a4-031a-47ba-9420-71459b07f5f1"}
  },

  authorize: function(refreshToken) {
    if (!refreshToken) {
      return new Promise(function(resolve, reject) {
        reject({error: "unauthorized", error_description: "unauthorized"});
      });
    }
    return this.validate(refreshToken).then(data => {
      //console.log(data);
      return data;
    });
  },

  validate: function(refreshToken) {
    var urlPath = ssoUrl + "/validate";
    var method = "POST";
    var payload = {
      refresh_token: refreshToken
    }
    return this.sendRequestPromise(urlPath, method, payload);
    // {"scope":"address cloud email openid phone profile","expires_in":59,"token_type":"Bearer","refresh_token":"c57a424f-bb9a-4bd0-972b-9e9bcf2dcb91","id_token":"eyAidHlwIjogIkpXVC...","access_token":"cd7d0840-ed68-4486-80f2-ba82c5e9f514"}
  },

  sendRequestPromise: function(urlPath, method, payload) {
    var deferred = Q.defer();
    this.sendRequest(urlPath, method, payload, function(err, data) {
      if (err) {
        deferred.reject(new Error(err));
      } else {
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  },

  sendRequest: function(urlPath, method, payload, cb) {

    var parsedUrl = url.parse(urlPath);
    var path = parsedUrl.path;
    if (method == 'GET') {
      path += '?' + querystring.stringify(payload);
    }
    var request_options = {
      hostname: parsedUrl.hostname,
      port: 80,
      path: path,
      method: method,
      /*headers: {
        "content-type": "application/json"
      }*/
    };
    console.log("request options:\n", request_options);

    var request = http.request(request_options, function(response) {
      //console.log("STATUS: " + response.statusCode);
      //console.log("HEADERS: " + JSON.stringify(response.headers));
      var ret = '';
      response.on('data', function(chunk) {
        //console.log('chunk : ' + chunk);
        ret += chunk;
      });
      response.on('end', function() {
        //console.log('ret : ' + ret);
        cb(null, ret);
      });
    });

    request.on("error", function(error) {
      console.log("sendResponse Error:" + error);
      cb(error);
    });

    // write data to request body
    if (method != 'GET') {
      request.write(JSON.stringify(payload));
    }
    request.end();
  }
}
