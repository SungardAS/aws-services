
var i = require('../index_sql_runner.js');
var event = {
  "sql": "select lineitem_productcode, to_char(sum(cast(lineItem_BlendedCost as float)), 'FM999,999,999,990D00'), to_char(sum(cast(lineitem_unblendedcost as float)), 'FM999,999,999,990D00') from AWSBilling201608 group by lineitem_productcode order by lineitem_productcode"
}
var context = {};
i.handler(event, context, function(err, data) {
  if (err)  console.log(err);
  console.log("successfully completed");
  console.log(data);
});
