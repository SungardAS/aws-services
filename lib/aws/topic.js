
var inherits = require('util').inherits;
var FlowController = require('../flow_controller');
var AWS = require('aws-sdk');

function AWSTopic() {

  FlowController.call(this);

  var me = this;

  me.findService = function(input) {
    var params = {region:input.region};
    console.log(global.sungardCreds);
    if (input.creds)  params.credentials = input.creds;
    else if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var sns = new AWS.SNS(params);
    return sns;
  }


  me.findTopic = function(input, callback) {

    var params = {};
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.listTopics(params, callback);
      console.log(sns);
      return;
    }

    self.callbackFind = function(data) {
      var topics = data.Topics.filter(function(topic) {
        return topic.TopicArn.indexOf(':' + input.topicName) > 0;
      });
      console.log(topics);
      if (topics[0]) {
        console.log("found a topic in region '" + input.region + "'");
        console.log(topics[0]);
        return topics[0];
      }
      console.log("topic '" + input.topicName + "' not found in region '" + input.region + "'");
      return null;
    }

    self.addParams = function(found) {
      self.params.topicArn = found.TopicArn;
    }

    var sns = me.preRun(self, input);
    sns.listTopics(params, me.callbackFind);
  }
  // { ResponseMetadata: { RequestId: '866fe642-a45c-562e-8fc1-a861c4705fdb' },
  //    Topics:
  //     [ { TopicArn: 'arn:aws:sns:us-west-2:290093585298:alextest1' },
  //       { TopicArn: 'arn:aws:sns:us-west-2:290093585298:config-topic' },
  //       { TopicArn: 'arn:aws:sns:us-west-2:290093585298:config-topic-temp' },
  //       { TopicArn: 'arn:aws:sns:us-west-2:290093585298:dynamodb' }
  //     ]
  //  }


  me.createTopic = function(input, callback) {

    var params = {
      Name: input.topicName
    };
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.createTopic(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.topicArn = data.TopicArn;
    }

    var sns = me.preRun(self, input);
    sns.createTopic(params, me.callback);
  }
  // { ResponseMetadata: { RequestId: '9dfc250a-edc7-5a6d-b4a4-6b229d29d13a' },
  //    TopicArn: 'arn:aws:sns:us-west-1:290093585298:config-topic-temp' }


  me.deleteTopic = function(input, callback) {

    var params = {
      TopicArn: input.topicArn
    };

    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.deleteTopic(params, callback);
      return;
    }

    var sns = me.preRun(self, input);
    sns.deleteTopic(params, me.callback);
  }

  me.addPermission = function(input, callback) {

   var label = (input.label) ? input.label : "lambda_access";
   var params = {
         AWSAccountId:[input.AccountId],  /*  AccountId],  /* required */
         ActionName: ['Subscribe','Receive','Publish'], /* required */
//         ActionName: ['*'],
         Label: label, /* required */
         TopicArn: input.topicArn /* required */
      };
console.log(params);
//   if (input.sourceAccount) {
  //    params['AWSAccountId'] = input.sourceAccount;
  //  }
    if (input.actionName) {
      params['ActionName'] = input.actionName;
    }
   var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.addPermission(params, callback);
     if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
      return;
    }

    var sns = me.preRun(self, input);
    sns.addPermission(params, me.callback);
//   sns.addPermission(params, function(err, data) {
  //  if (err) console.log(err, err.stack); // an error occurred
  //  else     console.log(data);           // successful response
  // });
}
  me.sendNotification = function(input, callback) {

    var params = {
      Message: input.message,
      /*MessageAttributes: {
        someKey: {
          DataType: 'STRING_VALUE', * required *
          BinaryValue: new Buffer('...') || 'STRING_VALUE',
          StringValue: 'STRING_VALUE'
        }
      },*/
      //MessageStructure: 'STRING_VALUE',
      Subject: input.subject,
      //TargetArn: 'STRING_VALUE',
      TopicArn: input.topicArn
    };
    console.log(params);
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.publish(params, callback);
      return;
    }

    var sns = me.preRun(self, input);
    sns.publish(params, me.callback);
  }


  me.listSubscriptions = function(input, callback) {

    var params = {
      TopicArn: input.topicArn, /* required */
      //NextToken: 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.listSubscriptionsByTopic(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.subscriptions = data.Subscriptions;
    }

    var sns = me.preRun(self, input);
    sns.listSubscriptionsByTopic(params, me.callback);
  }
  /*
  { ResponseMetadata:
    {RequestId: 'c142f3c3-350a-5041-a54a-bdf6ae8d74c0' },
    Subscriptions:
     [ { SubscriptionArn: 'arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesSimTopic:8948d1d6-6482-4730-93f7-1a2e0ff43a82',
         Owner: '290093585298',
         Protocol: 'lambda',
         Endpoint: 'arn:aws:lambda:us-east-1:290093585298:function:billing_notifier_sim',
         TopicArn: 'arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesSimTopic' } ]
  }
  */


  me.isSubscribed = function(input, callback) {

    var params = {
      TopicArn: input.topicArn, /* required */
      //NextToken: 'STRING_VALUE'
    };
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.listSubscriptionsByTopic(params, callback);
      return;
    }

    self.callbackFind = function(data) {
      var subs = data.Subscriptions.filter(function(sub) {
        return sub.Protocol === input.protocol && sub.Endpoint == input.endpoint;
      });
      console.log(subs);
      if (subs[0]) {
        console.log("already subscribed");
        console.log(subs[0]);
        return subs[0];
      }
      console.log("not subscribed");
      return null;
    }

    var sns = me.preRun(self, input);
    sns.listSubscriptionsByTopic(params, me.callbackFind);
  }
  /*
  { ResponseMetadata:
    {RequestId: 'c142f3c3-350a-5041-a54a-bdf6ae8d74c0' },
    Subscriptions:
     [ { SubscriptionArn: 'arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesSimTopic:8948d1d6-6482-4730-93f7-1a2e0ff43a82',
         Owner: '290093585298',
         Protocol: 'lambda',
         Endpoint: 'arn:aws:lambda:us-east-1:290093585298:function:billing_notifier_sim',
         TopicArn: 'arn:aws:sns:us-east-1:290093585298:IncreasedPercentagesSimTopic' } ]
  }
  */


  me.subscribeLambda = function(input, callback) {

    var params = {
      Protocol: 'lambda', /* required */
      TopicArn: input.topicArn, /* required */
      Endpoint: input.functionArn
    };
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.subscribe(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.subscriptionArn = data.SubscriptionArn;
    }

    var sns = me.preRun(self, input);
    sns.subscribe(params, me.callback);
  }


  me.subscribeEmail = function(input, callback) {

    var params = {
      Protocol: 'email', /* required */
      TopicArn: input.topicArn, /* required */
      Endpoint: input.emailAddress
    };
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.subscribe(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.subscriptionArn = data.SubscriptionArn;
    }

    var sns = me.preRun(self, input);
    sns.subscribe(params, me.callback);
  }


  me.subscribeHttp = function(input, callback) {

    var params = {
      Protocol: 'http',
      TopicArn: input.topicArn,
      Endpoint: input.url
    };
    var self = arguments.callee;

    if (callback) {
      var sns = me.findService(input);
      sns.subscribe(params, callback);
      return;
    }

    self.addParams = function(data) {
      self.params.subscriptionArn = data.SubscriptionArn;
    }

    var sns = me.preRun(self, input);
    sns.subscribe(params, me.callback);
  }


  me.unsubscribeAll = function(input, callback) {

    var self = arguments.callee;
    var sns = me.preRun(self, input);

    if (input.subscriptions.length > 0) {
      (function unsubscribeNext(idx) {
        var subscriptionArn = input.subscriptions[idx].SubscriptionArn;
        unsubscribe(sns, subscriptionArn, function(err, data) {
          if (err) {
            console.log("Error in unsubscribeAll : " + err, err.stack);
            me.errored(err);
          }
          else {
            idx++;
            if(idx < input.subscriptions.length) {
              unsubscribeNext(idx);
            }
          }
        });
      })(0);
    }
    console.log("successfully unsubscribeAll from a topic");
    me.succeeded(input);
  }

  function unsubscribe(sns, subscriptionArn, callback) {
    var params = {
      SubscriptionArn: subscriptionArn /* required */
    };
    sns.unsubscribe(params, function(err, data) {
      if (err) {
        console.log("Error in unsubscribe : " + err, err.stack);
        callback(err, null);
      }
      else {
        console.log("successfully unsubscribe from a topic");
        console.log(data);
        callback(null, data);
      }
    });
  }
}

module.exports = AWSTopic
