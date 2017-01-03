import React from 'react';
import { render } from 'react-dom';
import { Router, Route, hashHistory } from 'react-router';
import AppContainer from './containers/AppContainer';
import BillingComparisonListContainer from './containers/BillingComparisonListContainer';
import AccountDetailListContainer from './containers/AccountDetailListContainer';
import AccountServiceDetailListContainer from './containers/AccountServiceDetailListContainer';

window.React = React;

render(
  (<Router history={hashHistory}>
    <Route path="/" component={AppContainer}>
      <Route path="/billingComparisons" component={BillingComparisonListContainer} />
      <Route path="/accountDetail" component={AccountDetailListContainer} />
      <Route path="/accountServiceDetail" component={AccountServiceDetailListContainer} />
    </Route>
  </Router>), document.getElementById('content')
);
