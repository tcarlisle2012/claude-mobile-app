import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../context/AuthContext';

jest.mock('../../services/api');
const api = require('../../services/api');

function AuthConsumer() {
  const { user, isLoading, login, register, logout } = useAuth();
  const [error, setError] = useState('');
  return (
    <>
      <Text testID="loading">{String(isLoading)}</Text>
      <Text testID="user">{user ? JSON.stringify(user) : 'null'}</Text>
      <Text testID="error">{error}</Text>
      <TouchableOpacity
        testID="login"
        onPress={async () => {
          try {
            await login('john', 'pass');
          } catch (e: any) {
            setError(e?.message || 'unknown error');
          }
        }}
      />
      <TouchableOpacity
        testID="register"
        onPress={async () => {
          await register({
            username: 'john',
            email: 'j@test.com',
            password: 'pass1234',
            firstName: 'John',
            lastName: 'Doe',
          });
        }}
      />
      <TouchableOpacity testID="logout" onPress={logout} />
    </>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  api.getStoredToken.mockResolvedValue(null);
  api.getMe.mockResolvedValue(null);
  api.clearToken.mockResolvedValue(undefined);
});

describe('AuthContext - Loading and restore', () => {
  it('isLoading is initially true', () => {
    const { getByTestId } = renderAuth();
    expect(getByTestId('loading').props.children).toBe('true');
  });

  it('restores user from stored token', async () => {
    api.getStoredToken.mockResolvedValue('stored-token');
    api.getMe.mockResolvedValue({
      username: 'john',
      email: 'j@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    });

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    const user = JSON.parse(getByTestId('user').props.children);
    expect(user.username).toBe('john');
  });

  it('clears token when getMe fails', async () => {
    api.getStoredToken.mockResolvedValue('bad-token');
    api.getMe.mockRejectedValue(new Error('Unauthorized'));

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    expect(getByTestId('user').props.children).toBe('null');
    expect(api.clearToken).toHaveBeenCalled();
  });

  it('finishes loading when no token exists', async () => {
    api.getStoredToken.mockResolvedValue(null);

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    expect(getByTestId('user').props.children).toBe('null');
  });
});

describe('AuthContext - Login', () => {
  beforeEach(() => {
    api.getStoredToken.mockResolvedValue(null);
  });

  it('sets user on successful login', async () => {
    api.login.mockResolvedValue({
      accessToken: 'jwt',
      username: 'john',
      email: 'j@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    });

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    await act(async () => {
      fireEvent.press(getByTestId('login'));
    });

    const user = JSON.parse(getByTestId('user').props.children);
    expect(user.username).toBe('john');
    expect(api.login).toHaveBeenCalledWith({ username: 'john', password: 'pass' });
  });

  it('propagates login error', async () => {
    api.login.mockRejectedValue({ message: 'Bad credentials' });

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    await act(async () => {
      fireEvent.press(getByTestId('login'));
    });

    expect(getByTestId('error').props.children).toBe('Bad credentials');
    expect(getByTestId('user').props.children).toBe('null');
  });
});

describe('AuthContext - Register', () => {
  it('calls api.register with correct args', async () => {
    api.register.mockResolvedValue({ success: true, message: 'Check your email' });

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    await act(async () => {
      fireEvent.press(getByTestId('register'));
    });

    expect(api.register).toHaveBeenCalledWith({
      username: 'john',
      email: 'j@test.com',
      password: 'pass1234',
      firstName: 'John',
      lastName: 'Doe',
    });
  });
});

describe('AuthContext - Logout', () => {
  it('clears user and token on logout', async () => {
    api.getStoredToken.mockResolvedValue('token');
    api.getMe.mockResolvedValue({
      username: 'john',
      email: 'j@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    });

    const { getByTestId } = renderAuth();

    await waitFor(() => {
      const user = JSON.parse(getByTestId('user').props.children);
      expect(user.username).toBe('john');
    });

    await act(async () => {
      fireEvent.press(getByTestId('logout'));
    });

    expect(getByTestId('user').props.children).toBe('null');
    expect(api.clearToken).toHaveBeenCalled();
  });
});
