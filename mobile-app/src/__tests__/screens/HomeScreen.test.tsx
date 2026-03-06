import React from 'react';
import HomeScreen from '../../screens/HomeScreen';
import { renderWithTheme } from '../test-utils';

function renderScreen() {
  return renderWithTheme(<HomeScreen />);
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
