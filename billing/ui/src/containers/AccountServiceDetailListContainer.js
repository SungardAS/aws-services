import React from 'react';
import AccountServiceDetailList from '../components/AccountServiceDetailList';
import API from '../utilities/api';

class AccountServiceDetailListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      yearMonth: "201608",
      account: "714270045944",
      service: "AmazonEC2",
      lastEndDate: "2016-08-01T15:00:00Z",
      data: []
    };
  }

  componentDidMount() {
    const self = this;
    var yearMonth = this.props.location.query.yearMonth;
    if (!yearMonth) yearMonth = this.state.yearMonth;
    var account = this.props.location.query.account;
    if (!account) account = this.state.account;
    var service = this.props.location.query.service;
    if (!service) service = this.state.service;
    var lastEndDate = this.props.location.query.lastEndDate;
    if (!lastEndDate) lastEndDate = this.state.lastEndDate;
    const url = API.get_api_url() + '/sql';
    const method = 'POST';
    var sql = "select lineItem_UsageAccountId, \
      lineitem_productcode, \
      lineItem_UsageStartDate, \
      lineItem_UsageEndDate, \
      sum(cast(lineItem_BlendedCost as float)) blended, \
      sum(cast(lineitem_unblendedcost as float)) unblended, \
      to_char(sum(cast(lineItem_BlendedCost as float)), 'FM999990D00') blended_rounded, \
      to_char(sum(cast(lineitem_unblendedcost as float)), 'FM999990D00') unblended_rounded,  \
      max(lineitem_usageenddate) usageenddate ";
    sql += " from AWSBilling" + yearMonth;
    sql += " where lineitem_usageaccountid = '" + account + "'";
    sql += " and lineitem_productcode = '" + service + "'";
    sql += " and lineitem_usageenddate <= '" + lastEndDate + "'";
    sql += " group by lineItem_UsageAccountId, lineitem_productcode, lineItem_UsageStartDate, lineItem_UsageEndDate \
      order by lineItem_UsageAccountId, lineitem_productcode, lineItem_UsageStartDate, lineItem_UsageEndDate;"
    const params = {
      sql: sql
    };
    API.send_request(url, method, params).
    then(function(data) {
      self.setState({
        yearMonth: yearMonth,
        account: account,
        service: service,
        lastEndDate: lastEndDate,
        data: data
      });

    })
    .catch(function(err) {
      alert(err);
    });
  }

  render() {
    return (<AccountServiceDetailList data={this.state.data} />);
  }
}

export default AccountServiceDetailListContainer;
