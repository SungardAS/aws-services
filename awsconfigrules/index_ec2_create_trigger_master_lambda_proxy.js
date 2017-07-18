'use strict';

/**********************************************************************************************
* This scripts is a proxy lamdba that triggers 'awsconfigrules-ec2-create-trigger-db-update'
*     lambda in the same region in which the database recides.
**********************************************************************************************/
const aws = require('aws-sdk');
const lambda = new aws.Lambda({
    region: 'us-east-1'
});


// This is the handler that's invoked by Lambda
// Most of this code is boilerplate; use as is
exports.handler = (event, context, callback) => {
    var params = {
        ClientContext: "ProxyLambda",
        FunctionName: "awsconfigrules-ec2-create-trigger-db-update",
        InvocationType: "Event",
        Payload: JSON.stringify(event)
    };

    console.log("Sending params to msater lambda!");
    lambda.invoke(params, function(err, data) {
       if (err) console.log(err, err.stack); // an error occurred
       else     console.log(data);           // successful response
    });
};
