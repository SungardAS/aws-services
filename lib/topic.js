
function AWSTopic() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findService = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var sns = new AWS.SNS({region:input.region});
    return sns;
  }

  me.findTopic = function(input) {
    var sns = me.findService(input);
    var params = {};
    sns.listTopics(params, function(err, data) {
      if (err) {
        console.log("Error in listTopics : " + err, err.stack);
        fc.run_error_function(me.findTopic, err);
      }
      else {
        console.log(data);
        var topics = data.Topics.filter(function(topic) {
          return topic.TopicArn.indexOf(input.topicName) > 0;
        });
        console.log(topics);
        if (topics[0]) {
          console.log("found a topic in region '" + input.region + "'");
          console.log(topics[0]);
          input.topicArn = topics[0].TopicArn;
          fc.run_success_function(me.findTopic, input);
        }
        else {
          console.log("topic '" + input.topicName + "' not found in region '" + input.region + "'");
          fc.run_failure_function(me.findTopic, input);
        }
      }
    });
    // { ResponseMetadata: { RequestId: '866fe642-a45c-562e-8fc1-a861c4705fdb' },
    //    Topics:
    //     [ { TopicArn: 'arn:aws:sns:us-west-2:290093585298:alextest1' },
    //       { TopicArn: 'arn:aws:sns:us-west-2:290093585298:config-topic' },
    //       { TopicArn: 'arn:aws:sns:us-west-2:290093585298:config-topic-temp' },
    //       { TopicArn: 'arn:aws:sns:us-west-2:290093585298:dynamodb' }
    //     ]
    //  }
  }

  me.createTopic = function(input) {
    var sns = me.findService(input);
    params = {
      Name: input.topicName
    };
    sns.createTopic(params, function(err, data) {
      if (err) {
        console.log("Error in createTopic : " + err, err.stack);
        fc.run_error_function(me.createTopic, err);
      }
      else {
        console.log("successfully created a topic");
        console.log(data);
        input.topicArn = data.TopicArn;
        fc.run_success_function(me.createTopic, input);
      }
    });
    // { ResponseMetadata: { RequestId: '9dfc250a-edc7-5a6d-b4a4-6b229d29d13a' },
    //    TopicArn: 'arn:aws:sns:us-west-1:290093585298:config-topic-temp' }
  }

  me.deleteTopic = function(input) {
    var sns = me.findService(input);
    var params = {
      TopicArn: input.topicArn
    };
    sns.deleteTopic(params, function(err, data) {
      if (err) {
        console.log("Error in deleteTopic : " + err, err.stack);
        fc.run_error_function(me.deleteTopic, err);
      }
      else {
        console.log("successfully deleted a topic");
        console.log(data);
        fc.run_success_function(me.deleteTopic, input);
      }
    });
  }

  me.sendNotification = function(input) {

    var sns = me.findService(input);

    //var message = 'estimated amount : ' + input.amount + ', increased percentage = ' + input.percentage;
    //var subject = 'Notification for more than expected increase in estimated amount';
    //var topicArn = 'arn:aws:sns:us-east-1:054649790173:CalculatedPercentagesTopic';
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

    sns.publish(params, function(err, data) {
      if (err) {
        console.log("Error in publish : " + err, err.stack);
        fc.run_error_function(me.sendNotification, err);
      }
      else {
        console.log("successfully sent a notification");
        console.log(data);
        fc.run_success_function(me.sendNotification, input);
      }
    });
  }

  me.listSubscriptions = function(input) {
    var sns = me.findService(input);
    var params = {
      TopicArn: input.topicArn, /* required */
      //NextToken: 'STRING_VALUE'
    };
    sns.listSubscriptionsByTopic(params, function(err, data) {
      if (err) {
        console.log("Error in subscribe : " + err, err.stack);
        fc.run_error_function(me.listSubscriptions, err);
      }
      else {
        console.log("successfully listed all subscriptions");
        console.log(data);
        input.subscriptions = data.Subscriptions;
        fc.run_success_function(me.listSubscriptions, input);
      }
    });
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
  }

  me.subscribeLambda = function(input) {
    var sns = me.findService(input);
    var params = {
      Protocol: 'lambda', /* required */
      TopicArn: input.topicArn, /* required */
      Endpoint: input.functionArn
    };
    sns.subscribe(params, function(err, data) {
      if (err) {
        console.log("Error in subscribe : " + err, err.stack);
        fc.run_error_function(me.subscribeLambda, err);
      }
      else {
        console.log("successfully subscribed to a topic");
        console.log(data);
        input.subscriptionArn = data.SubscriptionArn;
        fc.run_success_function(me.subscribeLambda, input);
      }
    });
  }

  me.unsubscribeAll = function(input) {
    var sns = me.findService(input);
    if (input.subscriptions.length > 0) {
      (function unsubscribeNext(idx) {
        var subscriptionArn = input.subscriptions[idx].SubscriptionArn;
        unsubscribe(sns, subscriptionArn, function(err, data) {
          if (err) {
            console.log("Error in unsubscribeAll : " + err, err.stack);
            fc.run_error_function(me.unsubscribeAll, err);
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
    fc.run_success_function(me.unsubscribeAll, input);
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
