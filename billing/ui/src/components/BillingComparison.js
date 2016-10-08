import React from 'react';

const BillingComparison = ({ account, current_blended, prev_blended, diff_blended, diff_blended_per, current_unblended, prev_unblended, diff_unblended, diff_unblended_per, cur_last_end_date, prev_last_end_date, cur_year_month, prev_year_month }) => (
  <tr>
    <td><a href={`/#/accountDetail?account=${account}`}>{account}</a></td>
    <td>{current_blended}</td>
    <td>{prev_blended}</td>
    <td style={{ background:"#5D7B9D" }}>{diff_blended}</td>
    <td style={{ background:"#00FF00" }}>{diff_blended_per}%</td>
    <td>{current_unblended}</td>
    <td>{prev_unblended}</td>
    <td style={{ background:"#5D7B9D" }}>{diff_unblended}</td>
    <td style={{ background:"#00FF00" }}>{diff_unblended_per}%</td>
    <td>{cur_last_end_date}</td>
  </tr>
);

BillingComparison.propTypes = {
  account: React.PropTypes.string.isRequired,
  current_blended: React.PropTypes.number.isRequired,
  prev_blended: React.PropTypes.number.isRequired,
  diff_blended: React.PropTypes.number.isRequired,
  diff_blended_per: React.PropTypes.number.isRequired,
  current_unblended: React.PropTypes.number.isRequired,
  prev_unblended: React.PropTypes.number.isRequired,
  diff_unblended: React.PropTypes.number.isRequired,
  diff_unblended_per: React.PropTypes.number.isRequired,
  last_end_date: React.PropTypes.string.isRequired
};

export default BillingComparison;
