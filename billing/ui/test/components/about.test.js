import React from 'react';
import { expect } from 'chai';
import { shallow, mount, render } from 'enzyme';
import About from '../../src/components/About';

describe('About suite', function () {
  it('should render an `.about component`', () => {
    const wrapper = shallow(<About name="test" author="blah" version="blah" />);
    expect(wrapper.find('.about')).to.have.length(1);
  });
});
