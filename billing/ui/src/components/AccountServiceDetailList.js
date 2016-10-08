
import React from 'react';
import AccountServiceDetail from './AccountServiceDetail';

const AccountServiceDetailList = (accountServiceDetailList) => {
  const accountServiceDetailNodes = accountServiceDetailList.data
    .map((accountServiceDetail) =>
      <AccountServiceDetail account={accountServiceDetail.lineitem_usageaccountid} service={accountServiceDetail.lineitem_productcode} blended={accountServiceDetail.blended_rounded} unblended={accountServiceDetail.unblended_rounded} start_date={accountServiceDetail.lineitem_usagestartdate} end_date={accountServiceDetail.lineitem_usageenddate} />
    );
  return (
    <div className="container">
      <table className="table table-striped">
        <tbody>
          <tr>
            <th>Account</th>
            <th>Service</th>
            <th>Blended</th>
            <th>Unblended</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
          {accountServiceDetailNodes}
        </tbody>
      </table>
    </div>
  );
};

export default AccountServiceDetailList;
