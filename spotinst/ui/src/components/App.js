import React from 'react';
import { Link } from 'react-router';

const App = ({ children }) => (
  <div className="containter">
    <header>
      <h3>SpotInstances</h3>
      <Link to="/ec2">EC2 With Low Usages</Link>
    </header>
    <section>
      {children}
    </section>
  </div>
);

App.propTypes = {
  children: React.PropTypes.object
};

export default App;
