import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

function renderScreen() {
  return render(
    <ThemeProvider>
      <HomeScreen />
    </ThemeProvider>,
  );
}

describe('HomeScreen', () => {
  it('renders greeting text', () => {
    const { getByText } = renderScreen();
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders subtitle text', () => {
    const { getByText } = renderScreen();
    expect(getByText('Welcome to your new app')).toBeTruthy();
  });
});
