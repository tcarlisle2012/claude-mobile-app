import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/Button';
import { ThemeProvider } from '../../theme/ThemeContext';

function renderComponent(props: React.ComponentProps<typeof Button>) {
  return render(
    <ThemeProvider>
      <Button {...props} />
    </ThemeProvider>,
  );
}

describe('Button', () => {
  it('renders title', () => {
    const { getByText } = renderComponent({ title: 'Save', onPress: jest.fn() });
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderComponent({ title: 'Save', onPress });
    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = renderComponent({
      title: 'Save',
      onPress: jest.fn(),
      loading: true,
    });
    expect(queryByText('Save')).toBeNull();
    const indicator = UNSAFE_getByType(require('react-native').ActivityIndicator);
    expect(indicator).toBeTruthy();
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByRole } = renderComponent({ title: 'Save', onPress, loading: true });
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders danger variant', () => {
    const { getByText } = renderComponent({
      title: 'Delete',
      onPress: jest.fn(),
      variant: 'danger',
    });
    expect(getByText('Delete')).toBeTruthy();
  });

  it('renders outline variant', () => {
    const { getByText } = renderComponent({
      title: 'Cancel',
      onPress: jest.fn(),
      variant: 'outline',
    });
    expect(getByText('Cancel')).toBeTruthy();
  });
});
