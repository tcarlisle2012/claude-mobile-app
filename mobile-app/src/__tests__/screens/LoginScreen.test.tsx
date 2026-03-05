import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

function renderScreen() {
  const navigation = { navigate: mockNavigate } as any;
  return render(
    <ThemeProvider>
      <LoginScreen navigation={navigation} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('renders title and subtitle', () => {
    const { getByText } = renderScreen();
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to your account')).toBeTruthy();
  });

  it('renders username and password inputs', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('Enter your username')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('renders Sign In button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows error when form is submitted empty', async () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sign In'));
    expect(getByText('Please enter both username and password.')).toBeTruthy();
  });

  it('shows error when only username is entered', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'john');
    fireEvent.press(getByText('Sign In'));
    expect(getByText('Please enter both username and password.')).toBeTruthy();
  });

  it('calls login with trimmed credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Enter your username'), ' john ');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(mockLogin).toHaveBeenCalledWith('john', 'password123');
  });

  it('displays error from failed login', async () => {
    mockLogin.mockRejectedValue({ message: 'Invalid credentials' });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrong');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  it('shows fallback error message when error has no message', async () => {
    mockLogin.mockRejectedValue({});
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Enter your username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrong');

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    expect(getByText('Login failed. Please try again.')).toBeTruthy();
  });

  it('navigates to Register on Sign Up press', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sign Up'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });
});
