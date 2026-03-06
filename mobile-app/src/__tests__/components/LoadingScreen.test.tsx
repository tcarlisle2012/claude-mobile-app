import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingScreen from '../../components/LoadingScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

function renderComponent(props = {}) {
  return render(
    <ThemeProvider>
      <LoadingScreen {...props} />
    </ThemeProvider>,
  );
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
