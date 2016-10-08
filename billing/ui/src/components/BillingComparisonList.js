
import React from 'react';
import BillingComparison from './BillingComparison';

const BillingComparisonList = (billingComparisonList) => {
  const billingComparisonNodes = billingComparisonList.data
    .map((billingComparison) =>
      <BillingComparison account={billingComparison.account} key={billingComparison.account} current_blended={billingComparison.cur_blended_rounded} prev_blended={billingComparison.prev_blended_rounded} diff_blended={billingComparison.diff_blended} diff_blended_per={billingComparison.diff_blended_percentages} current_unblended={billingComparison.cur_unblended_rounded} prev_unblended={billingComparison.prev_unblended_rounded} diff_unblended={billingComparison.diff_unblended} diff_unblended_per={billingComparison.diff_unblended_percentages} cur_last_end_date={billingComparison.cur_last_end_date} prev_last_end_date={billingComparison.prev_last_end_date} cur_year_month={billingComparison.cur_year_month} prev_year_month={billingComparison.prev_year_month} />
    );
  return (
    <div className="container">
      <table className="table table-striped">
        <tbody>
          <tr>
            <th>Account</th>
            <th>Current Blended</th>
            <th>Previous Blended</th>
            <th>Diff</th>
            <th>Diff in %</th>
            <th>Current Unblended</th>
            <th>Previous Unblended</th>
            <th>Diff</th>
            <th>Diff in %</th>
            <th>Last End Date</th>
          </tr>
          {billingComparisonNodes}
        </tbody>
      </table>
    </div>
  );
};

export default BillingComparisonList;
