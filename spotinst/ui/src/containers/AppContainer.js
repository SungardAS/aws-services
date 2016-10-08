import React from 'react';
import App from '../components/App';
import API from '../utilities/api';

class AppContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
  }

  render() {
    return (<App children={this.props.children} />);
  }
}

export default AppContainer;
