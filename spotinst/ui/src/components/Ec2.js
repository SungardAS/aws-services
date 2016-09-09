import React from 'react';

const Ec2 = ({ id, name, account, region, cpu, network, days, asg, lbs, spot, priceHandler }) => (
  <tr>
    <td><a href={`/#/spot?account=${account}&region=${region}&instanceId=${id}&name=${name}`}>{id}</a></td>
    <td><a href="#" name={name} value={id} onClick={ priceHandler } >{name}</a></td>
    <td>{region}</td>
    <td>{cpu}</td>
    <td>{network}</td>
    <td>{days}</td>
    <td>{asg}</td>
    <td>{lbs}</td>
    <td>{spot}</td>
  </tr>
);

Ec2.propTypes = {
  id: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  region: React.PropTypes.string.isRequired,
  cpu: React.PropTypes.string.isRequired,
  network: React.PropTypes.string.isRequired,
  days: React.PropTypes.string.isRequired,
  asg: React.PropTypes.string.isRequired,
  lbs: React.PropTypes.string.isRequired,
  spot: React.PropTypes.string.isRequired
};

export default Ec2;
