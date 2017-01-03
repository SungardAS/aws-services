import React from 'react';
import { Link } from 'react-router';

const App = ({ children }) => (
  <div className="containter">
    <header>
      <h3>Billing</h3>
      <Link to="/billingComparisons">Dashboard</Link>
      <Link to="/accountDetail">AccountDetail</Link>
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
