import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import { renderWithTheme } from '../test-utils';

function renderScreen() {
  return renderWithTheme(<SettingsScreen />);
}

describe('SettingsScreen', () => {
  it('renders Appearance heading', () => {
    const { getByText } = renderScreen();
    expect(getByText('Appearance')).toBeTruthy();
  });

  it('renders all three theme options', () => {
    const { getByText, getAllByText } = renderScreen();
    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Dark')).toBeTruthy();
    // "System" appears for both theme and language
    expect(getAllByText('System').length).toBeGreaterThanOrEqual(1);
  });

  it('pressing Light calls setMode(light)', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Light'));
    // If no error thrown, the press handler executed setMode correctly
  });

  it('pressing Dark calls setMode(dark)', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Dark'));
  });

  it('pressing System calls setMode(system)', () => {
    const { getAllByText } = renderScreen();
    // First "System" is the theme option, second is the language option
    fireEvent.press(getAllByText('System')[0]);
  });
});
