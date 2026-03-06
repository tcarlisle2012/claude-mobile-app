import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import useApiQuery from '../../hooks/useApiQuery';
import { ThemeProvider } from '../../theme/ThemeContext';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => any) => {
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

function TestComponent({ fetcher, fallback }: { fetcher: () => Promise<any>; fallback: string }) {
  const { data, loading, error, onRefresh } = useApiQuery(fetcher, fallback);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>{error}</Text>;
  return (
    <>
      <Text>{JSON.stringify(data)}</Text>
      <TouchableOpacity onPress={onRefresh}>
        <Text>Refresh</Text>
      </TouchableOpacity>
    </>
  );
}

function renderHook(fetcher: () => Promise<any>, fallback = 'Error') {
  return render(
    <ThemeProvider>
      <TestComponent fetcher={fetcher} fallback={fallback} />
    </ThemeProvider>,
  );
}

describe('useApiQuery', () => {
  it('shows loading initially', () => {
    const { getByText } = renderHook(() => new Promise(() => {}));
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders data on success', async () => {
    const { getByText } = renderHook(() => Promise.resolve({ name: 'Test' }));
    await waitFor(() => {
      expect(getByText('{"name":"Test"}')).toBeTruthy();
    });
  });

  it('renders error on failure', async () => {
    const { getByText } = renderHook(
      () => Promise.reject({ message: 'Not Found' }),
      'Fallback',
    );
    await waitFor(() => {
      expect(getByText('Not Found')).toBeTruthy();
    });
  });

  it('uses fallback error when message is empty', async () => {
    const { getByText } = renderHook(
      () => Promise.reject({}),
      'Fallback error',
    );
    await waitFor(() => {
      expect(getByText('Fallback error')).toBeTruthy();
    });
  });

  it('supports refresh', async () => {
    let callCount = 0;
    const fetcher = jest.fn(() => {
      callCount++;
      return Promise.resolve({ count: callCount });
    });

    const { getByText } = renderHook(fetcher);
    await waitFor(() => {
      expect(getByText('{"count":1}')).toBeTruthy();
    });

    fireEvent.press(getByText('Refresh'));
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
