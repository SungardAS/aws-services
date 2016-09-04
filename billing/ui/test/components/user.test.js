import React from 'react';
import { expect } from 'chai';
import { shallow, mount, render } from 'enzyme';
import User from '../../src/components/User';

describe('User suite', function () {
  it('should render an `.user component`', () => {
    const wrapper = shallow(<User name="test" age="15" />);
    expect(wrapper.find('.user')).to.have.length(1);
  });
});
