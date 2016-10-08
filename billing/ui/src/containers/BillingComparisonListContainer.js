import React from 'react';
import BillingComparisonList from '../components/BillingComparisonList';
import API from '../utilities/api';

class BillingComparisonListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
  }

  componentDidMount() {
    const self = this;
    const url = API.get_api_url() + '/comparison';
    const method = 'GET';
    const params = {};
    API.send_request(url, method, params).
    then(function(data) {
      self.setState({data: data});
    })
    .catch(function(err) {
      alert(err);
    });
  }

  render() {
    return (<BillingComparisonList data={this.state.data} />);
  }
}

export default BillingComparisonListContainer;
