import React from 'react';
import EmptyState from '../../components/EmptyState';
import { renderWithTheme } from '../test-utils';

describe('EmptyState', () => {
  it('renders message', () => {
    const { getByText } = renderWithTheme(
      <EmptyState icon="people-outline" message="No users found" />,
    );
    expect(getByText('No users found')).toBeTruthy();
  });
});
