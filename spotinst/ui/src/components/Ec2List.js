
import React from 'react';
import Ec2 from './Ec2';

const Ec2List = (ec2List) => {
  const accounts = ec2List.accounts
    .map((account) => <option value={account.awsid} key={account.awsid} >{account.awsid} - {account.name}</option>);

  const ec2Nodes = ec2List.data
    .map((ec2) =>
      <Ec2 name={ec2.metadata[2]} key={ec2.metadata[1]} account={ec2.account} id={ec2.metadata[1]} region={ec2.region} cpu={ec2.metadata[19]} network={ec2.metadata[20]} days={ec2.metadata[21]} asg={ec2.autoScalingGroupName} lbs={ec2.loadBalancerNames} spot={(ec2.detail)? ec2.detail.InstanceLifecycle: ""} priceHandler={ec2List.priceHandler} />
    );
  return (
    <div className="container">
    <div>
      <span>
        <select name="account" value={ec2List.account} onChange={ ec2List.changeHandler } >
          <option value="">Select account...</option>
          {[...accounts]}
        </select>
      </span>
      &nbsp;&nbsp;
      <span>
        <button className="small" onClick={ ec2List.submitHandler }>submit</button>
      </span>
    </div>
    <br/>
      <table className="table table-striped">
        <tbody>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Region</th>
            <th>Average CPU Utilization</th>
            <th>Average Network I/O</th>
            <th>Days</th>
            <th>Auto Scaling Group</th>
            <th>Load Balancers</th>
            <th>Lifecycle</th>
          </tr>
          {ec2Nodes}
        </tbody>
      </table>
    </div>
  );
};

export default Ec2List;
