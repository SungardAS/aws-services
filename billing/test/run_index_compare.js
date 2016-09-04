
var i = require('../index_compare.js');
var event = {
  "account": "714270045944"
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(JSON.stringify(data, null, 2));
});
