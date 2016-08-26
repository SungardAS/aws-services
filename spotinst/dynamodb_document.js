
var AWS = require('aws-sdk');

module.exports = {

  save: function(tableName, messageJSON, region) {
    var docClient = new AWS.DynamoDB.DocumentClient({region: region});
    var params = {
      TableName : tableName,
      Item: messageJSON
    };
    return docClient.put(params).promise();
  },

  removeOldItems: function(tableName, intervalHour, region) {
    var docClient = new AWS.DynamoDB.DocumentClient({region: region});
    var d = new Date();
    d.setHours(d.getHours() - intervalHour);
    console.log(d.toISOString());
    var params = {
      TableName : tableName,
      FilterExpression : 'ReportedAt < :ReportedAt',
      ExpressionAttributeValues : {':ReportedAt' : d.toISOString()}
    };
    return docClient.scan(params).promise().then(function(items) {
      console.log(items);
      var promises = [];
      items.Items.forEach(function(item) {
        promises.push(docClient.delete({
          TableName : tableName,
          Key: {
            HashKey: item.HashKey,
            //RangeKey: item.RangeKey
          }
        }).promise());
      });
      return promises;
    }).then(function(promises) {
      return Promise.all(promises).then(function(ret) {
        console.log(ret);
        return ret;
      });
    })
  }
}
