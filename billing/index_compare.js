'use strict';

let AWS = require('aws-sdk');
var pgp = require('pg-promise')();
let dateformat = require('dateformat');
let diffHours = 6;

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var fs = require("fs");
  var data = fs.readFileSync(__dirname + '/json/default.json', {encoding:'utf8'});
  var data_json = JSON.parse(data);

  let bucketRegion = data_json.bucketRegion;
  let redshiftConnectionString = data_json.redshiftConnectionString;
  let redshiftUser = data_json.redshiftUser;
  let redshiftPass = data_json.redshiftPass;
  console.log('data_json:', data_json);

  var yearMonth = dateformat(new Date(), 'yyyymm');
  var queryMaxEndDate = "select MAX(lineitem_usageenddate) \
		from AWSBilling<year_month> \
		where datediff(hour,cast(lineitem_usagestartdate as datetime),cast(lineitem_usageenddate as datetime)) = 1;"
	queryMaxEndDate = queryMaxEndDate.replace("<year_month>", yearMonth);
  console.log('queryMaxEndDate:', queryMaxEndDate);

  var yearMonth = dateformat(new Date(), 'yyyymm');
  var querySum = "select lineItem_UsageAccountId, \
    sum(cast(lineItem_BlendedCost as float)) blended, \
    sum(cast(lineitem_unblendedcost as float)) unblended \
    from AWSBilling<year_month> \
    where lineitem_usageenddate <= '<usage_end_date>' \
    group by lineItem_UsageAccountId \
    order by lineItem_UsageAccountId;"
    //to_char(sum(cast(lineItem_BlendedCost as float)), 'FM999990D00') blended_rounded, \
    //to_char(sum(cast(lineitem_unblendedcost as float)), 'FM999990D00') unblended_rounded, \
    //and lineitem_usageaccountid = '<account>' \
  //querySum = querySum.replace("<account>", event.account);
  console.log('querySum:', querySum);

  /*var queryHistoryData = "select sum(cast(lineitem_unblendedcost as float)) unblended, \
    sum(cast(lineitem_blendedcost as float)) blended \
    from AWSBilling<year_month> \
    where lineitem_usageaccountid = '<account>' \
    and datediff(hour,cast(lineitem_usagestartdate as datetime),cast(lineitem_usageenddate as datetime)) = 1 \
    and lineitem_usagestartdate >= '<from_datetime>' and lineitem_usagestartdate < '<end_datetime>';";
  queryHistoryData = queryHistoryData.replace("<account>", event.account);*/

  var connection = null;
  var kms = new AWS.KMS({region:bucketRegion});
  var params = {
    CiphertextBlob: new Buffer(redshiftPass, 'base64')
  };
  kms.decrypt(params).promise().then(function(data) {
    redshiftPass = data.Plaintext.toString();
    redshiftConnectionString = 'pg:' + redshiftUser + ':' + redshiftPass + '@' + redshiftConnectionString;
    console.log('completed to build redshiftConnectionString');
  }).then(function() {
    // connect to the redshift
    var conn = pgp(redshiftConnectionString);
    console.log("We've got a connection");
    connection = conn;
  }).then(function() {
    // find the last cost datetime
    console.log("finding last end date");
    return connection.query(queryMaxEndDate).then(function(result) {
      console.log(result);
      var lastEndDate = result[0].max;
      return lastEndDate;
    }).catch(function(err) {
      console.log(err);
      pgp.end();
      callback(err);
    });
  }).then(function(lastEndDate) {
    // find the sum of current month
    console.log("finding the sum of current month");
    var querySumForThisMonth = querySum.replace("<year_month>", yearMonth).replace("<usage_end_date>", lastEndDate);
    console.log(querySumForThisMonth);
    return connection.query(querySumForThisMonth).then(function(result) {
      console.log(result);
      var data = {current: {last_end_date:lastEndDate, sum: result}};
      console.log(data);
      return data;
    }).catch(function(err) {
      console.log(err);
      pgp.end();
      callback(err);
    });
  }).then(function(data) {
    // find the sum of prev month
    console.log("finding the sum of prev month");
    var lastEndDate = new Date(data.current.last_end_date);
    lastEndDate = lastEndDate.setMonth(lastEndDate.getMonth() - 1);
    var lastEndDateStr = new Date(lastEndDate).toISOString().replace(".000Z", "Z");
    var yearLastMonth = dateformat(new Date(lastEndDate), 'yyyymm');
    var querySumForPrevMonth = querySum.replace("<year_month>", yearLastMonth).replace("<usage_end_date>", lastEndDateStr);
    console.log(querySumForPrevMonth);
    return connection.query(querySumForPrevMonth).then(function(result) {
      console.log(result);
      data.prev = {last_end_date: lastEndDateStr, sum: result};
      return data;
      /*
      { current:
       { last_end_date: '2016-09-01T15:00:00Z',
         sum:
          { lineitem_usageaccountid: '266593598212',
            blended: 25.19039007,
            unblended: 25.34712655,
            blended_rounded: '25.19',
            unblended_rounded: '25.35' } },
      prev:
       { last_end_date: '2016-08-01T15:00:00Z',
         sum:
          { lineitem_usageaccountid: '266593598212',
            blended: 19.89425762,
            unblended: 19.8563658,
            blended_rounded: '19.89',
            unblended_rounded: '19.86' } } }
      */
    }).catch(function(err) {
      console.log(err);
      pgp.end();
      callback(err);
    });
  /*}).then(function(lastEndDate) {
    // find the sum of current month
    var startDatetime = new Date(lastEndDate);
    startDatetime = startDatetime.setHours(startDatetime.getHours() - diffHours);
    startDatetime = new Date(startDatetime).toISOString();
    var queryHistoryDataForThisMonth = queryHistoryData.replace("<year_month>", yearMonth).replace("<from_datetime>", startDatetime).replace("<end_datetime>", lastEndDate);
    console.log(queryHistoryDataForThisMonth);
    return connection.client.queryP(queryHistoryDataForThisMonth).then(function(result) {
      console.log(result);
      var data = {current: {from: startDatetime, to: lastEndDate, sum: result.rows[0]}};
      console.log(data);
      return data;
    }).catch(function(err) {
      console.log(err);
      if (connection) connection.client.end();
      callback(err);
    });
  }).then(function(data) {
    // find the sum of prev month
    var startDatetime = new Date(data.current.from);
    startDatetime = startDatetime.setMonth(startDatetime.getMonth() - 1);
    startDatetime = new Date(startDatetime).toISOString();
    var endDatetime = new Date(data.current.to);
    endDatetime = endDatetime.setMonth(endDatetime.getMonth() - 1);
    var yearLastMonth = dateformat(new Date(endDatetime), 'yyyymm');
    endDatetime = new Date(endDatetime).toISOString();
    var queryHistoryDataForPrevMonth = queryHistoryData.replace("<year_month>", yearLastMonth).replace("<from_datetime>", startDatetime).replace("<end_datetime>", endDatetime);
    console.log(queryHistoryDataForPrevMonth);
    return connection.client.queryP(queryHistoryDataForPrevMonth).then(function(result) {
      console.log(result);
      data.prev = {from: startDatetime, to: endDatetime, sum: result.rows[0]};
      return data;
    }).catch(function(err) {
      console.log(err);
      if (connection) connection.client.end();
      callback(err);
    });*/
  }).then(function(data) {
    console.log(data);
    pgp.end();
    var merged = merge(data);
    //callback(null, merged);
    var list = toList(merged);
    callback(null, list);
  }).catch(function(err) {
    console.log(err);
    pgp.end();
    callback(err);
  });
};

function merge(data) {
  var accounts = {};
  data.current.sum.forEach(function(sum) {
    accounts[sum.lineitem_usageaccountid] = {current: sum};
  });
  data.prev.sum.forEach(function(sum) {
    accounts[sum.lineitem_usageaccountid].prev = sum;
  });
  Object.keys(accounts).forEach(function(key) {
    var diff = {};
    //console.log(accounts[key]);
    if (accounts[key].current && accounts[key].prev) {
      accounts[key].current.blended_rounded = round(accounts[key].current.blended);
      accounts[key].current.unblended_rounded = round(accounts[key].current.unblended);
      accounts[key].prev.blended_rounded = round(accounts[key].prev.blended);
      accounts[key].prev.unblended_rounded = round(accounts[key].prev.unblended);
      diff.blended = round(accounts[key].current.blended_rounded - accounts[key].prev.blended_rounded);
      diff.unblended = round(accounts[key].current.unblended_rounded - accounts[key].prev.unblended_rounded);
      if (accounts[key].prev.blended_rounded > 0) {
        diff.blended_percentages = round((diff.blended / accounts[key].prev.blended_rounded) * 100);
      }
      else {
        diff.blended_percentages = diff.blended;
      }
      if (accounts[key].prev.unblended_rounded) {
        diff.unblended_percentages = round((diff.unblended / accounts[key].prev.unblended_rounded) * 100);
      }
      else {
        diff.blended_percentages = diff.unblended;
      }
    }
    accounts[key].diff = diff;
  });
  var merged = {accounts: accounts};
  merged.last_end_date = {current: data.current.last_end_date, prev: data.prev.last_end_date};
  return merged;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function toList(data) {
  var list = [];
  Object.keys(data.accounts).forEach(function(key) {
    console.log(data.accounts[key]);
    var account_sum = {
      account: data.accounts[key].current.lineitem_usageaccountid,
      cur_blended: data.accounts[key].current.blended,
      cur_unblended: data.accounts[key].current.unblended,
      cur_blended_rounded: data.accounts[key].current.blended_rounded,
      cur_unblended_rounded: data.accounts[key].current.unblended_rounded
    };
    if (data.accounts[key].prev) {
      account_sum.prev_blended = data.accounts[key].prev.blended,
      account_sum.prev_unblended = data.accounts[key].prev.unblended,
      account_sum.prev_blended_rounded = data.accounts[key].prev.blended_rounded,
      account_sum.prev_unblended_rounded = data.accounts[key].prev.unblended_rounded,
      account_sum.diff_blended = data.accounts[key].diff.blended,
      account_sum.diff_unblended = data.accounts[key].diff.unblended,
      account_sum.diff_blended_percentages = data.accounts[key].diff.blended_percentages,
      account_sum.diff_unblended_percentages = data.accounts[key].diff.unblended_percentages
    }
    account_sum.cur_last_end_date = data.last_end_date.current;
    account_sum.prev_last_end_date = data.last_end_date.prev;
    account_sum.cur_year_month = dateformat(new Date(data.last_end_date.current), 'yyyymm');
    account_sum.prev_year_month = dateformat(new Date(data.last_end_date.prev), 'yyyymm');
    list.push(account_sum);
  });
  return list;
}
