/**
* A sample Lambda function that looks up the latest Windows AMI ID
* for a given region and Windows AMI base name.
**/

// Map display OS names to AMI name patterns
var osNameToPattern = {
    "Windows Server 2008 SP2 32-bit": "Windows_Server-2008-SP2-English-32Bit-Base-*",
    "Windows Server 2008 SP2 64-bit": "Windows_Server-2008-SP2-English-64Bit-Base-*",
    "Windows Server 2008 R2 64-bit": "Windows_Server-2008-R2_SP1-English-64Bit-Base-*",
	  "Windows Server 2012 64-bit": "Windows_Server-2012-RTM-English-64Bit-Base-*",
	  "Windows Server 2012 R2 64-bit": "Windows_Server-2012-R2_RTM-English-64Bit-Base-*"
};

var aws = require("aws-sdk");

exports.handler = function(event, context) {

    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

    // For Delete requests, immediately send a SUCCESS response.
    if (event.RequestType == "Delete") {
        sendResponse(event, context, "SUCCESS");
        return;
    }

    var responseStatus = "FAILED";
    var responseData = {};
    var osBaseName = osNameToPattern[event.ResourceProperties.OSName];

    console.log("OS: " + event.ResourceProperties.OSName + " -> " + osBaseName);

    var ec2 = new aws.EC2({region: event.ResourceProperties.Region});
    var describeImagesParams = {
        Filters: [{ Name: "name", Values: [osBaseName]}],
        Owners: ["amazon"]
    };

    console.log( "Calling describeImages...");

    // Get the available AMIs for the specified Windows version.
    ec2.describeImages(describeImagesParams, function(err, describeImagesResult) {
        if (err) {
            responseData = {Error: "DescribeImages call failed"};
            console.log(responseData.Error + ":\n", err);
        }
        else {
            console.log( "Got a response back from the server");

            var images = describeImagesResult.Images;

            console.log( "Got " + images.length + " images back" );

    		// Sort the images by descending creation date order so the
	    	// most recent image is first in the array.
		    images.sort(function(x,y){
			    return x.CreationDate < y.CreationDate;
		    });

            for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
                responseStatus = "SUCCESS";
                responseData["Id"] = images[imageIndex].ImageId;
                responseData["Name"] = images[imageIndex].Name;
                console.log( "Found: " + images[imageIndex].Name + ", " + images[imageIndex].ImageId);
                break;
            }
        }
        sendResponse(event, context, responseStatus, responseData);
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
