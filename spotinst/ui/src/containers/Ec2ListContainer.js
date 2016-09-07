import React from 'react';
import Ec2List from '../components/Ec2List';
import API from '../utilities/api';

class Ec2ListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      accounts: [
      ],
      accountRoleArns: {},
      externalIds: {},
      federateRoleArn: '',
      account: ''
    };
  }

  componentDidMount() {
    const self = this;
    self.find_accounts();
  }

  find_accounts() {
    const self = this;
    const federateAccount = '089476987273';
    const mainRegion = 'us-east-1';
    const url = API.get_msaws_api_url() + '/accounts?account=' + federateAccount + '&region=' + mainRegion;
    const method = 'GET';
    const params = {};
    API.send_request(url, method, params).
    then(function(data) {
      let accountRoleArns = {};
      let externalIds = {};
      data.accounts.map(function(account) {
        accountRoleArns[account.awsid] = account.arn;
        externalIds[account.awsid] = account.externalid;
      })
      self.setState({
        accounts: data.accounts,
        accountRoleArns: accountRoleArns,
        externalIds: externalIds,
        federateRoleArn: data.federateRoleArn
      });
    })
    .catch(function(err) {
      alert(err);
    });
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
    if(e) e.preventDefault();
    const self = this;
    const accountRoleArn = this.state.accountRoleArns[this.state.account];
    const externalId = this.state.externalIds[this.state.account];
    const url = API.get_api_url() + '/ec2?federateRoleArn=' + this.state.federateRoleArn + '&accountRoleArn=' + accountRoleArn + '&externalId=' + externalId ;
    const method = 'GET';
    const params = {};
    API.send_request(url, method, params).
    then(function(data) {
      if (data.errorMessage) {
        alert(JSON.stringify(data));
        return;
      }
      data.forEach(function(instance) {
        instance.account = self.state.account;
        if (instance.autoScalingGroup) {
          instance.loadBalancerNames = instance.autoScalingGroup.LoadBalancerNames.toString().replace(',', ', ');
        }
        else {
          instance.loadBalancerNames = null;
        }
      });
      self.setState({data: data});
    })
    .catch(function(err) {
      alert(err);
    });
  }

  render() {
    let changeHandler = this.handleChange.bind(this);
    let submitHandler = this.handleSubmit.bind(this);
    return (<Ec2List data={this.state.data} accounts={this.state.accounts} changeHandler={changeHandler} submitHandler={submitHandler} />);
  }
}

export default Ec2ListContainer;
