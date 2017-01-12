import React from 'react';
import SpotinstBuilder from '../components/SpotinstBuilder';
import API from '../utilities/api';

// Purpose: How things work (data fetching, state updates)
// Aware of flux: yes
// To read data: one option is to read from flux state
// To change data: Dispatch Redux actions

class SpotinstBuilderContainer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      accounts: [
      ],
      accountRoleArns: {},
      externalIds: {},
      federateRoleArn: '',
      spotinstAccessKeys: {
      },
      dryRun: 'true',
      account: '',
      instanceId: '',
      name: '',
      description: '',
      tags: '[ ]',
      keyPairName: '',
      spotinstAccessKey: '',
      output: ''
    };
  }

  componentWillMount() {
    var self = this;
    self.find_accounts();
    if (self.props.location.query.account) {
      self.setState({account: self.props.location.query.account});
    }
    if (self.props.location.query.region) {
      self.setState({region: self.props.location.query.region});
    }
    if (self.props.location.query.instanceId) {
      self.setState({instanceId: self.props.location.query.instanceId});
    }
    if (self.props.location.query.name) {
      var name = self.props.location.query.name.replace(/ /g, '-') + '-elastigroup';
      self.setState({name: name});
      self.setState({description: name});
      self.setState({tags: '[{"Key":"Name","Value":"' + name + '"}]'});
    }
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
    this.setState({
      [name]: value
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const account = this.state.account.trim();
    const region = this.state.region.trim();
    const dryRun = this.state.dryRun;
    const instanceId = this.state.instanceId.trim();
    const name = this.state.name.trim();
    const description = this.state.description.trim();
    const tags = this.state.tags.trim().replace(/\"/g, '\\\"');
    const keyPairName = this.state.keyPairName.trim();
    const spotinstAccessKey = this.state.spotinstAccessKeys[account];
    if (!account || !instanceId || !name || !description || !tags || !keyPairName) {
      alert("missing info");
      return;
    }
    const accountRoleArn = this.state.accountRoleArns[this.state.account];
    const externalId = this.state.externalIds[this.state.account];
    const params = {
      federateRoleArn: this.state.federateRoleArn,
      accountRoleArn: accountRoleArn,
      externalId: externalId,
      account: account,
      region: region,
      dryRun: dryRun,
      instanceId: instanceId,
      name: name,
      description: description,
      tags: tags,
      keyPairName: keyPairName,
      spotinstAccessKey: spotinstAccessKey
    };
    const self = this;
    const url = API.get_api_url() + '/spotinst';
    const method = 'POST';
    API.send_request(url, method, params).
    then(function(data) {
      if (data.errorMessage) {
        alert(JSON.stringify(data));
        return;
      }
      self.setState({output: JSON.stringify(data, null, 2)});
    })
    .catch(function(err) {
      alert(err);
    });
    // this.setState({account: '', role: ''});
  }

  render() {
    let changeHandler = this.handleChange.bind(this);
    let submitHandler = this.handleSubmit.bind(this);
    return (<SpotinstBuilder accounts={this.state.accounts} account={this.state.account} dryRun={this.state.dryRun} instanceId={this.state.instanceId}
      name={this.state.name} description={this.state.description} tags={this.state.tags} keyPairName={this.state.keyPairName} output={this.state.output}
      region={this.state.region} changeHandler={changeHandler} submitHandler={submitHandler} />);
  }
}

export default SpotinstBuilderContainer;
