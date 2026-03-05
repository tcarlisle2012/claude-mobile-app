import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { LightTheme, DarkTheme } from '../../theme/colors';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

const mockedUseColorScheme = useColorScheme as jest.Mock;

function ThemeConsumer() {
  const { colors, isDark, mode, setMode } = useTheme();
  return (
    <>
      <Text testID="isDark">{String(isDark)}</Text>
      <Text testID="mode">{mode}</Text>
      <Text testID="bg">{colors.background}</Text>
      <Text
        testID="setLight"
        onPress={() => setMode('light')}
      />
      <Text
        testID="setDark"
        onPress={() => setMode('dark')}
      />
      <Text
        testID="setSystem"
        onPress={() => setMode('system')}
      />
    </>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>,
  );
}

describe('colors.ts', () => {
  it('LightTheme and DarkTheme have the same keys', () => {
    expect(Object.keys(LightTheme).sort()).toEqual(
      Object.keys(DarkTheme).sort(),
    );
  });

  it('LightTheme has all expected keys', () => {
    const expectedKeys = [
      'background',
      'surface',
      'surfaceVariant',
      'primary',
      'primaryLight',
      'text',
      'textSecondary',
      'border',
      'icon',
      'drawerActive',
      'drawerActiveBackground',
      'statusBar',
    ];
    for (const key of expectedKeys) {
      expect(LightTheme).toHaveProperty(key);
    }
  });
});

describe('ThemeContext', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReturnValue('light');
  });

  it('defaults to system mode', () => {
    const { getByTestId } = renderTheme();
    expect(getByTestId('mode').props.children).toBe('system');
  });

  it('system mode with light scheme returns LightTheme', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { getByTestId } = renderTheme();
    expect(getByTestId('isDark').props.children).toBe('false');
    expect(getByTestId('bg').props.children).toBe(LightTheme.background);
  });

  it('system mode with dark scheme returns DarkTheme', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = renderTheme();
    expect(getByTestId('isDark').props.children).toBe('true');
    expect(getByTestId('bg').props.children).toBe(DarkTheme.background);
  });

  it('system mode with null scheme defaults to light', () => {
    mockedUseColorScheme.mockReturnValue(null);
    const { getByTestId } = renderTheme();
    expect(getByTestId('isDark').props.children).toBe('false');
  });

  it('setMode(dark) switches to dark theme', () => {
    const { getByTestId } = renderTheme();
    fireEvent.press(getByTestId('setDark'));
    expect(getByTestId('isDark').props.children).toBe('true');
    expect(getByTestId('bg').props.children).toBe(DarkTheme.background);
  });

  it('setMode(light) switches to light theme', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = renderTheme();
    fireEvent.press(getByTestId('setLight'));
    expect(getByTestId('isDark').props.children).toBe('false');
    expect(getByTestId('bg').props.children).toBe(LightTheme.background);
  });
});
