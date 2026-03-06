import React from 'react';
import { render } from '@testing-library/react-native';
import Badge from '../../components/Badge';

describe('Badge', () => {
  it('renders label text', () => {
    const { getByText } = render(
      <Badge label="Active" color="#22C55E" backgroundColor="#DCFCE7" />,
    );
    expect(getByText('Active')).toBeTruthy();
  });

  it('renders with md size', () => {
    const { getByText } = render(
      <Badge label="UP" color="#22C55E" backgroundColor="#DCFCE7" size="md" />,
    );
    expect(getByText('UP')).toBeTruthy();
  });
});
