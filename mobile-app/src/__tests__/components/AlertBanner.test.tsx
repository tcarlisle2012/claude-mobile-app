import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AlertBanner from '../../components/AlertBanner';
import { ThemeProvider } from '../../theme/ThemeContext';

function renderComponent(props: React.ComponentProps<typeof AlertBanner>) {
  return render(
    <ThemeProvider>
      <AlertBanner {...props} />
    </ThemeProvider>,
  );
}

describe('AlertBanner', () => {
  it('renders error message', () => {
    const { getByText } = renderComponent({ message: 'Something went wrong', type: 'error' });
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders success message', () => {
    const { getByText } = renderComponent({ message: 'Saved!', type: 'success' });
    expect(getByText('Saved!')).toBeTruthy();
  });

  it('renders retry label when onRetry is provided', () => {
    const { getByText } = renderComponent({
      message: 'Error',
      type: 'error',
      onRetry: jest.fn(),
      retryLabel: 'Tap to retry',
    });
    expect(getByText('Tap to retry')).toBeTruthy();
  });

  it('calls onRetry when pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = renderComponent({
      message: 'Error',
      type: 'error',
      onRetry,
      retryLabel: 'Retry',
    });
    fireEvent.press(getByText('Error'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry label without onRetry', () => {
    const { queryByText } = renderComponent({ message: 'Error', type: 'error' });
    expect(queryByText('Tap to retry')).toBeNull();
  });

  it('has alert accessibility role', () => {
    const { getByLabelText } = renderComponent({
      message: 'Msg',
      type: 'error',
      onRetry: jest.fn(),
      retryLabel: 'Retry',
    });
    expect(getByLabelText('Msg. Retry')).toBeTruthy();
  });
});
