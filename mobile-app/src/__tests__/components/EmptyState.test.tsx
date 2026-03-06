import React from 'react';
import { render } from '@testing-library/react-native';
import EmptyState from '../../components/EmptyState';
import { ThemeProvider } from '../../theme/ThemeContext';

describe('EmptyState', () => {
  it('renders message', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState icon="people-outline" message="No users found" />
      </ThemeProvider>,
    );
    expect(getByText('No users found')).toBeTruthy();
  });
});
