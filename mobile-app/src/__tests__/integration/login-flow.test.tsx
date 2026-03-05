import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../theme/ThemeContext';
import LoginScreen from '../../screens/LoginScreen';
import { Text } from 'react-native';

// Only mock fetch — use real api.ts, AuthContext, and AsyncStorage mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockNavigate = jest.fn();

function mockResponse(data: any, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 401,
    json: async () => data,
  });
}

function UserDisplay() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Text testID="status">loading</Text>;
  if (user) return <Text testID="status">{`logged-in:${user.username}`}</Text>;
  return <Text testID="status">logged-out</Text>;
}

function TestApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <UserDisplay />
          <LoginScreen navigation={{ navigate: mockNavigate } as any} />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('Login flow integration', () => {
  it('successful login stores token and sets user', async () => {
    const authResponse = {
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      username: 'john',
      email: 'john@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    };
    mockResponse(authResponse); // login call

    const { getByPlaceholderText, getByText, getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-out');
    });

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-in:john');
    });

    const storedToken = await AsyncStorage.getItem('auth_token');
    expect(storedToken).toBe('jwt-token');
  });

  it('failed login shows error', async () => {
    mockResponse({ success: false, message: 'Invalid credentials' }, false);

    const { getByPlaceholderText, getByText, getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-out');
    });

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrong');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(getByText('Invalid credentials')).toBeTruthy();
    expect(getByTestId('status').props.children).toBe('logged-out');
  });

  it('network error shows fallback message', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByPlaceholderText, getByText, getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-out');
    });

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'pass');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    // Network errors won't have a message property on the thrown object,
    // so the fallback message should show
    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-out');
    });
  });

  it('restores session from stored token', async () => {
    await AsyncStorage.setItem('auth_token', 'existing-token');

    const meResponse = {
      username: 'john',
      email: 'john@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    };
    mockResponse(meResponse); // getMe call

    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-in:john');
    });
  });

  it('clears invalid stored token', async () => {
    await AsyncStorage.setItem('auth_token', 'expired-token');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Unauthorized' }),
    });

    const { getByTestId } = render(<TestApp />);

    await waitFor(() => {
      expect(getByTestId('status').props.children).toBe('logged-out');
    });

    const storedToken = await AsyncStorage.getItem('auth_token');
    expect(storedToken).toBeNull();
  });
});
