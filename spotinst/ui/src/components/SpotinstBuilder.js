
import React from 'react';

const SpotinstBuilder = (spotinstBuilder) => {
  const accounts = spotinstBuilder.accounts
    .map((account) =>
      <option value={account.awsid} key={account.awsid} >{account.awsid} - {account.name}</option>
    );
  return (
    <div classNameName="container">
      <div>
        <div>
          <label>AWS Account Id</label>
          &nbsp;&nbsp;
          <span>
            <select name="account" value={spotinstBuilder.account} onChange={ spotinstBuilder.changeHandler } >
              <option value="">Select account...</option>
              {[...accounts]}
            </select>
          </span>
        </div>
        <br/>
        <div>
          <label>DryRun</label>
          &nbsp;&nbsp;
          <span>
            <select name="dryRun" value={spotinstBuilder.dryRun} onChange={ spotinstBuilder.changeHandler } >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </span>
        </div>
        <br/>
        <div>
          <label>EC2 Instance Id</label>
          &nbsp;&nbsp;
          <span><input name="instanceId" value={ spotinstBuilder.instanceId } onChange={ spotinstBuilder.changeHandler } /></span>
        </div>
        <br/>
        <div>
          <label>EC2 Instance Region</label>
          &nbsp;&nbsp;
          <span><input name="region" value={ spotinstBuilder.region } onChange={ spotinstBuilder.changeHandler } /></span>
        </div>
        <br/>
        <div>
          <label>Spotinst Name</label>
          &nbsp;&nbsp;
          <span><input name="name" value={ spotinstBuilder.name } onChange={ spotinstBuilder.changeHandler } style={{ width: '300px' }} /></span>
        </div>
        <br/>
        <div>
          <label>Spotinst Description</label>
          &nbsp;&nbsp;
          <span><input name="description" value={ spotinstBuilder.description } onChange={ spotinstBuilder.changeHandler } style={{ width: '400px' }} /></span>
        </div>
        <br/>
        <div>
          <label>Spotinst Tags</label>
          &nbsp;&nbsp;
          <span><input name="tags" value={ spotinstBuilder.tags } onChange={ spotinstBuilder.changeHandler } style={{ width: '600px' }} /></span>
        </div>
        <br/>
        <div>
          <label>Spotinst KeyPair Name</label>
          &nbsp;&nbsp;
          <span><input name="keyPairName" value={ spotinstBuilder.keyPairName } onChange={ spotinstBuilder.changeHandler } style={{ width: '300px' }} /></span>
        </div>
        <br/>
        <div className="start">
          <button className="small" onClick={ spotinstBuilder.submitHandler }>submit</button>
        </div>
        <br/>
        <div id="output" className="start">
          <label>Output</label>
          <div style={{ overflow: 'auto' }} id="content">
            <textarea className="form-control" rows={20} value={ spotinstBuilder.output } />
          </div>
        </div>
    </div>
    </div>
  );
};

export default SpotinstBuilder;
