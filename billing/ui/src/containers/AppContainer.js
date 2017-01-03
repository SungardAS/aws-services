import React from 'react';
import App from '../components/App';

class AppContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
    return (<App children={this.props.children} />);
  }
}

export default AppContainer;
