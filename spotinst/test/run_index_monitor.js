
var i = require('../index_monitor.js');
var event = {
  "version": "0",
  "id": "29288009-8275-4104-bf63-72d202c9c27f",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "089476987273",
  "time": "2016-08-25T18:44:05Z",
  "region": "us-east-1",
  "resources": [ "arn:aws:events:us-east-1:089476987273:rule/SpotinstBuilder-EventSchedule-VD5CIMG0MM3H" ],
  "detail": {}
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
