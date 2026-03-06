import React from 'react';
import { Text } from 'react-native';
import Card from '../../components/Card';
import { renderWithTheme } from '../test-utils';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <Text>Card content</Text>
      </Card>,
    );
    expect(getByText('Card content')).toBeTruthy();
  });
});
