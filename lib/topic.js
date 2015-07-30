
function AWSTopic() {

  var AWS = require('aws-sdk');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.findTopic = function(input) {
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var sns = new AWS.SNS({region:input.region});
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
    if (input.profile) {
      var credentials = new AWS.SharedIniFileCredentials({profile: input.profile});
      AWS.config.credentials = credentials;
    }
    var sns = new AWS.SNS({region:input.region});
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
    var sns = new AWS.SNS({region:input.region});
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
}

module.exports = AWSTopic
