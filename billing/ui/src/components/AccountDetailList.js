
import React from 'react';
import AccountDetail from './AccountDetail';

const AccountDetailList = (accountDetailList) => {
  const accounts = accountDetailList.accounts
    .map((account) => <option key={account.lineitem_usageaccountid} value={account.lineitem_usageaccountid}>{account.lineitem_usageaccountid}</option>);

  const accountDetailNodes = accountDetailList.data
    .map((accountDetail) =>
      <AccountDetail account={accountDetail.account} key={accountDetail.service} service={accountDetail.service} current_blended={accountDetail.cur_blended_rounded} prev_blended={accountDetail.prev_blended_rounded} diff_blended={accountDetail.diff_blended} diff_blended_per={accountDetail.diff_blended_percentages} current_unblended={accountDetail.cur_unblended_rounded} prev_unblended={accountDetail.prev_unblended_rounded} diff_unblended={accountDetail.diff_unblended} diff_unblended_per={accountDetail.diff_unblended_percentages} cur_last_end_date={accountDetail.cur_last_end_date} prev_last_end_date={accountDetail.prev_last_end_date} cur_year_month={accountDetail.cur_year_month} prev_year_month={accountDetail.prev_year_month}/>
    );
  return (
    <div className="container">
      <div>
        <span>
          <select name="account" value={accountDetailList.account} onChange={ accountDetailList.changeHandler } >
            <option value="">Select account...</option>
            {[...accounts]}
          </select>
        </span>
        &nbsp;&nbsp;
        <span>
          <button className="small" onClick={ accountDetailList.submitHandler }>submit</button>
        </span>
      </div>
      <br/>
      <table className="table table-striped">
        <tbody>
          <tr>
          <th>Account</th>
          <th>Service</th>
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
          {accountDetailNodes}
        </tbody>
      </table>
    </div>
  );
};

export default AccountDetailList;
