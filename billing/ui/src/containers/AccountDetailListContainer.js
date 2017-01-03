import React from 'react';
import AccountDetailList from '../components/AccountDetailList';
import API from '../utilities/api';

class AccountDetailListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      data: [],
      accounts: []
    };
  }

  find_accounts() {
    const self = this;
    const url = API.get_api_url() + '/sql';
    const method = 'POST';
    let dateformat = require('dateformat');
    const yearMonth = dateformat(new Date(), 'yyyymm');
    var sql = "select distinct(lineItem_UsageAccountId) from AWSBilling" + yearMonth + " order by lineItem_UsageAccountId";
    const params = {sql: sql};
    API.send_request(url, method, params).
    then(function(data) {
      //alert(JSON.stringify(data));
      self.setState({accounts: data});
      if (self.props.location.query.account) {
        self.setState({account:self.props.location.query.account});
        self.find();
      }
    })
    .catch(function(err) {
      alert(err);
    });
  }

  componentDidMount() {
    const self = this;
    self.find_accounts();
  }

  handleChange(e) {
    const name = e.target.name;
    const value = e.target.value;
    //alert(e.target.name);
    this.setState({
      [name]: value
    });
    //alert(JSON.stringify(this.state));
  }

  handleSubmit(e) {
    const self = this;
    if(e) e.preventDefault();
    self.find();
  }

  find() {
    const self = this;
    var account = self.state.account;
    const url = API.get_api_url() + '/comparison?account=' + account;
    const method = 'GET';
    const params = {};
    API.send_request(url, method, params).
    then(function(data) {
      self.setState({
        account: account,
        data: data
      });

    })
    .catch(function(err) {
      alert(err);
    });
  }

  render() {
    let changeHandler = this.handleChange.bind(this);
    let submitHandler = this.handleSubmit.bind(this);
    return (<AccountDetailList accounts={this.state.accounts} data={this.state.data} account={this.state.account} changeHandler={changeHandler} submitHandler={submitHandler} />);
  }
}

export default AccountDetailListContainer;
