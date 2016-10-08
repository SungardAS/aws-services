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
      spotinstAccessKeys: {
        "089476987273": "",
        "290093585298": "",
        "876224653878": "",
        "054649790173": "",
        "546276914724": "",
        "607481993316": "",
        "714270045944": "",
        "897824193103": ""
      },
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
    //const url = API.get_api_url() + '/ec2?federateRoleArn=' + this.state.federateRoleArn + '&accountRoleArn=' + accountRoleArn + '&externalId=' + externalId ;
    //const method = 'GET';
    //const params = {};
    const url = API.get_api_url() + '/spotinst/ec2';
    const method = 'POST';
    const params = {
      "federateRoleArn": this.state.federateRoleArn,
      "accountRoleArn": accountRoleArn,
      "externalId": externalId,
      "region": "us-east-1"
    };
    API.send_request(url, method, params, 'refresh_token').
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

  handleCloudformation(e) {
    e.preventDefault();
    const instanceId = e.target.value;
    const region = e.target.name;
    const accountRoleArn = this.state.accountRoleArns[this.state.account];
    const externalId = this.state.externalIds[this.state.account];
    const spotinstAccessKey = this.state.spotinstAccessKeys[this.state.account];
    const params = {
      federateRoleArn: this.state.federateRoleArn,
      accountRoleArn: accountRoleArn,
      externalId: externalId,
      instanceId: instanceId,
      region: region,
      spotinstAccessKey: spotinstAccessKey
    };
    const self = this;
    const url = API.get_api_url() + '/spotinst/cloudformation';
    const method = 'POST';
    API.send_request(url, method, params, 'refresh_token').
    then(function(data) {
      if (data.errorMessage) {
        alert(JSON.stringify(data));
        return;
      }
      //self.setState({output: JSON.stringify(data, null, 2)});
      alert(data.consoleUrl);
      window.open(data.consoleUrl, '_aws');
    })
    .catch(function(err) {
      alert(err);
    });
    // this.setState({account: '', role: ''});
  }

  handlePrice(e) {
    if(e) e.preventDefault();
    const self = this;
    const accountRoleArn = this.state.accountRoleArns[this.state.account];
    const externalId = this.state.externalIds[this.state.account];
    const url = API.get_price_api_url() + '';
    const method = 'GET';
    const params = {};
    API.send_request(url, method, params, 'refresh_token').
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
    let cloudformationHandler = this.handleCloudformation.bind(this);
    let priceHandler = this.handlePrice.bind(this);
    return (<Ec2List data={this.state.data} accounts={this.state.accounts} changeHandler={changeHandler} submitHandler={submitHandler} cloudformationHandler={cloudformationHandler} priceHandler={priceHandler}/>);
  }
}

export default Ec2ListContainer;
