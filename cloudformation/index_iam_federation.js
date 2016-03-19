
exports.handler = function(event, context) {

  console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
  console.log("context:\n" + JSON.stringify(context));

  var responseStatus = "FAILED";
  var responseData = {};

  var packageJSON = event.ResourceProperties;
  if (typeof(packageJSON) === 'string') {
    packageJSON = JSON.parse(packageJSON);
  }

  var action = 'deploy';
  if (event.RequestType == "Delete") {
    action = 'clean';
  }

  var federation = new (require('./iam_federation'))();
  federation.build(action, packageJSON, function(err, data) {
    if (err) {
      console.log(err);
      sendResponse(event, context, responseStatus, responseData);
    }
    else {
      console.log("successfully completed : " + data);
      responseStatus = "SUCCESS";
      responseData.Output = data;
      console.log(responseData);
      sendResponse(event, context, responseStatus, responseData);
    }
  });
};

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData) {

    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    console.log("RESPONSE BODY:\n", responseBody);

    var https = require("https");
    var url = require("url");

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    console.log("SENDING RESPONSE...\n");

    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    // write data to request body
    request.write(responseBody);
    request.end();
}
