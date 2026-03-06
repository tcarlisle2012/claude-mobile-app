import React from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import { renderWithTheme } from '../test-utils';

function renderComponent(props = {}) {
  return renderWithTheme(<LoadingScreen {...props} />);
}

describe('LoadingScreen', () => {
  it('renders an ActivityIndicator', () => {
    const { UNSAFE_getByType } = renderComponent();
    const indicator = UNSAFE_getByType(require('react-native').ActivityIndicator);
    expect(indicator).toBeTruthy();
  });

  it('uses custom color when provided', () => {
    const { UNSAFE_getByType } = renderComponent({ color: '#FF0000' });
    const indicator = UNSAFE_getByType(require('react-native').ActivityIndicator);
    expect(indicator.props.color).toBe('#FF0000');
  });
});
