
var AWS = require('aws-sdk');
var region = 'us-east-1';

module.exports = {

  getStackInfo: function(stackName) {
    var cloudformation = new AWS.CloudFormation({region: region});
    var params = {
      //NextToken: 'STRING_VALUE',
      StackName: 'dev-api'
    };
    return cloudformation.describeStacks(params).promise().then(function(data) {
      if (data.Stacks.length == 0) return null;
      else return data.Stacks[0];
    });
    /*
      { ResponseMetadata: { RequestId: '553ac097-661c-11e6-ba74-3b72b50bd6a7' },
    Stacks:
     [ { StackId: 'arn:aws:cloudformation:us-east-1:089476987273:stack/dev-api/455a8da0-cd23-11e5-b4be-500c5242948e',
         StackName: 'dev-api',
         Parameters: [
          {
            "ParameterKey": "SSOBasicAuthUsername",
            "ParameterValue": "msaws"
          },
          {
            "ParameterKey": "ReadCapacityUnits",
            "ParameterValue": "1"
          }
        ],
         CreationTime: Sat Feb 06 2016 16:45:07 GMT-0600 (CST),
         LastUpdatedTime: Thu Aug 04 2016 02:10:57 GMT-0500 (CDT),
         StackStatus: 'UPDATE_COMPLETE',
         DisableRollback: false,
         NotificationARNs: [],
         Capabilities: [Object],
         Outputs: [],
         Tags: [] } ] }
    */
  },

  estimate: function(stack, templateURL) {
    var cloudformation = new AWS.CloudFormation({region: region});
    var params = {
      Parameters: stack.Parameters.map(function(parameter) {
          parameter.UsePreviousValue = true;
          return parameter;
        }),
      /*Parameters: [
        {
          ParameterKey: 'STRING_VALUE',
          ParameterValue: 'STRING_VALUE',
          UsePreviousValue: true || false
        },
        * more items *
      ],
      TemplateBody: 'STRING_VALUE',*/
      TemplateURL: templateURL
    };
    console.log(params);
    return cloudformation.estimateTemplateCost(params).promise();
  }

}


var templateURL = 'https://s3.amazonaws.com/sgas.msaws.development.089476987273.us-east-1/particles/cftemplates/full_stack.template.json';
var stackName = 'dev-api';
var cf = require('./cloudformation');
cf.getStackInfo(stackName).then(function(stack) {
  console.log(stack);
  cf.estimate(stack, templateURL).then(function(data) {
    console.log(data);
  }).catch(function(err) {
    console.log(err);
  });
});
