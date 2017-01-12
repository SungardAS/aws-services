'use strict';

let kms = require('../lib/aws_promise/kms');
let pgp = require('pg-promise')();
let dateformat = require('dateformat');

module.exports = {

  get: function(params) {

    let fs = require("fs");
    let data = fs.readFileSync(__dirname + '/json/default.json', {encoding:'utf8'});
    let data_json = JSON.parse(data);

    let kmsRegion = data_json.kmsRegion;
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
    var querySum = "";

    if (params.account) {
      querySum = "select lineItem_UsageAccountId, lineitem_productcode, \
        sum(cast(lineItem_BlendedCost as float)) blended, \
        sum(cast(lineitem_unblendedcost as float)) unblended \
        from AWSBilling<year_month> \
        where lineitem_usageenddate <= '<usage_end_date>' \
        and lineitem_usageaccountid = '<account>' \
        group by lineItem_UsageAccountId, lineitem_productcode \
        order by lineItem_UsageAccountId, lineitem_productcode;"
        //to_char(sum(cast(lineItem_BlendedCost as float)), 'FM999990D00') blended_rounded, \
        //to_char(sum(cast(lineitem_unblendedcost as float)), 'FM999990D00') unblended_rounded, \
      querySum = querySum.replace("<account>", params.account);
    }
    else {
      querySum = "select lineItem_UsageAccountId, \
        sum(cast(lineItem_BlendedCost as float)) blended, \
        sum(cast(lineitem_unblendedcost as float)) unblended \
        from AWSBilling<year_month> \
        where lineitem_usageenddate <= '<usage_end_date>' \
        group by lineItem_UsageAccountId \
        order by lineItem_UsageAccountId;"
        //to_char(sum(cast(lineItem_BlendedCost as float)), 'FM999990D00') blended_rounded, \
        //to_char(sum(cast(lineitem_unblendedcost as float)), 'FM999990D00') unblended_rounded, \
        //and lineitem_usageaccountid = '<account>' \
      //querySum = querySum.replace("<account>", params.account);
    }
    console.log('querySum:', querySum);

    /*var queryHistoryData = "select sum(cast(lineitem_unblendedcost as float)) unblended, \
      sum(cast(lineitem_blendedcost as float)) blended \
      from AWSBilling<year_month> \
      where lineitem_usageaccountid = '<account>' \
      and datediff(hour,cast(lineitem_usagestartdate as datetime),cast(lineitem_usageenddate as datetime)) = 1 \
      and lineitem_usagestartdate >= '<from_datetime>' and lineitem_usagestartdate < '<end_datetime>';";
    queryHistoryData = queryHistoryData.replace("<account>", params.account);*/

    var connection = null;
    var input = {
      region: kmsRegion,
      password: redshiftPass
    };
    return kms.decrypt(input).then(function(data) {
      redshiftPass = data.Plaintext.toString();
      redshiftConnectionString = 'pg:' + redshiftUser + ':' + redshiftPass + '@' + redshiftConnectionString;
      console.log('completed to build redshiftConnectionString');
    }).then(function() {
      // connect to the redshift
      connection = pgp(redshiftConnectionString);
      console.log("We've got a connection");
      // find the last cost datetime
      console.log("finding last end date");
      return connection.query(queryMaxEndDate).then(function(result) {
        console.log(result);
        var lastEndDate = result[0].max;
        return lastEndDate;
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
      });
    }).then(function(data) {
      console.log(data);
      pgp.end();
      if (params.account) {
        var merged = mergeServices(data);
        return merged;
      }
      else {
        var merged = mergeAccounts(data);
        var list = toListAccounts(merged);
        return list;
      }
    });
  }
}

// need to merge 'mergeAccounts' & 'toListAccounts' like 'mergeServices'!!!!
function mergeAccounts(data) {
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

function toListAccounts(data) {
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

function mergeServices(data) {
  var services = {};
  data.current.sum.forEach(function(sum) {
    services[sum.lineitem_productcode] = {current: sum};
  });
  data.prev.sum.forEach(function(sum) {
    if (services[sum.lineitem_productcode]) services[sum.lineitem_productcode].prev = sum;
    else services[sum.lineitem_productcode] = {current: null, prev: sum};
  });
  var merged = [];
  Object.keys(services).forEach(function(key) {
    var service_sum = {};
    if (services[key].current) {
      service_sum.account = services[key].current.lineitem_usageaccountid;
      service_sum.service = services[key].current.lineitem_productcode;
      service_sum.cur_blended = services[key].current.blended;
      service_sum.cur_unblended = services[key].current.unblended;
      service_sum.cur_blended_rounded = round(services[key].current.blended);
      service_sum.cur_unblended_rounded = round(services[key].current.unblended);
    }
    if (services[key].prev) {
      service_sum.account = services[key].prev.lineitem_usageaccountid;
      service_sum.service = services[key].prev.lineitem_productcode;
      service_sum.prev_blended = services[key].prev.blended;
      service_sum.prev_unblended = services[key].prev.unblended;
      service_sum.prev_blended_rounded = round(services[key].prev.blended);
      service_sum.prev_unblended_rounded = round(services[key].prev.unblended);
    }
    if (services[key].current && services[key].prev) {
      service_sum.diff_blended = round(services[key].current.blended - services[key].prev.blended);
      service_sum.diff_unblended = round(services[key].current.unblended - services[key].prev.unblended);
      if (service_sum.prev_blended_rounded > 0) {
        service_sum.diff_blended_percentages = round((service_sum.diff_blended / service_sum.prev_blended_rounded) * 100);
      }
      else {
        service_sum.diff_blended_percentages = service_sum.diff_blended;
      }
      if (service_sum.prev_unblended_rounded) {
        service_sum.diff_unblended_percentages = round((service_sum.diff_unblended / service_sum.prev_unblended_rounded) * 100);
      }
      else {
        service_sum.diff_unblended_percentages = service_sum.diff_unblended;
      }
    }
    service_sum.cur_last_end_date = data.current.last_end_date;
    service_sum.prev_last_end_date = data.prev.last_end_date;
    service_sum.cur_year_month = dateformat(new Date(data.current.last_end_date), 'yyyymm');
    service_sum.prev_year_month = dateformat(new Date(data.prev.last_end_date), 'yyyymm');
    merged.push(service_sum);
  });
  return merged;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
