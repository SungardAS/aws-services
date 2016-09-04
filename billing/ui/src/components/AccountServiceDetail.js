import React from 'react';

const AccountServiceDetail = ({ account, service, blended, unblended, start_date, end_date }) => (
  <tr>
    <td>{account}</td>
    <td>{service}</td>
    <td>{blended}</td>
    <td>{unblended}</td>
    <td>{start_date}</td>
    <td>{end_date}</td>
  </tr>
);

AccountServiceDetail.propTypes = {
  account: React.PropTypes.string.isRequired,
  service: React.PropTypes.string.isRequired,
  blended: React.PropTypes.string.isRequired,
  unblended: React.PropTypes.string.isRequired,
  start_date: React.PropTypes.string.isRequired,
  end_date: React.PropTypes.string.isRequired
};

export default AccountServiceDetail;
