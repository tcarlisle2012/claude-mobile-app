import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import Card from '../../components/Card';
import { ThemeProvider } from '../../theme/ThemeContext';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card>
          <Text>Card content</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByText('Card content')).toBeTruthy();
  });
});
