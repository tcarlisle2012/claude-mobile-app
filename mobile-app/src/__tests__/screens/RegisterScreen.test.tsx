import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RegisterScreen from '../../screens/RegisterScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

jest.spyOn(Alert, 'alert');

function renderScreen() {
  const navigation = { navigate: mockNavigate } as any;
  return render(
    <ThemeProvider>
      <RegisterScreen navigation={navigation} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

function fillForm(
  getByPlaceholderText: any,
  overrides: Record<string, string> = {},
) {
  const defaults: Record<string, string> = {
    John: 'John',
    Doe: 'Doe',
    john_doe: 'john_doe',
    'john@example.com': 'john@example.com',
    'Min. 8 characters': 'password123',
  };
  const values = { ...defaults, ...overrides };
  for (const [placeholder, value] of Object.entries(values)) {
    fireEvent.changeText(getByPlaceholderText(placeholder), value);
  }
}

function pressSubmitButton(getAllByText: any) {
  // "Create Account" appears as both title and button text; the button is last
  const elements = getAllByText('Create Account');
  fireEvent.press(elements[elements.length - 1]);
}

describe('RegisterScreen', () => {
  it('renders title and subtitle', () => {
    const { getAllByText, getByText } = renderScreen();
    expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Sign up to get started')).toBeTruthy();
  });

  it('renders all five input fields', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('John')).toBeTruthy();
    expect(getByPlaceholderText('Doe')).toBeTruthy();
    expect(getByPlaceholderText('john_doe')).toBeTruthy();
    expect(getByPlaceholderText('john@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Min. 8 characters')).toBeTruthy();
  });

  it('shows required errors when form submitted empty', () => {
    const { getAllByText, getByText } = renderScreen();
    pressSubmitButton(getAllByText);

    expect(getByText('First name is required')).toBeTruthy();
    expect(getByText('Last name is required')).toBeTruthy();
    expect(getByText('Username is required')).toBeTruthy();
    expect(getByText('Email is required')).toBeTruthy();
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('shows username min length error', () => {
    const { getAllByText, getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('john_doe'), 'ab');
    pressSubmitButton(getAllByText);
    expect(getByText('Username must be at least 3 characters')).toBeTruthy();
  });

  it('shows email format error', () => {
    const { getAllByText, getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('john@example.com'), 'notanemail');
    pressSubmitButton(getAllByText);
    expect(getByText('Please enter a valid email')).toBeTruthy();
  });

  it('shows password min length error', () => {
    const { getAllByText, getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Min. 8 characters'), 'short');
    pressSubmitButton(getAllByText);
    expect(getByText('Password must be at least 8 characters')).toBeTruthy();
  });

  it('clears field error when user types in that field', () => {
    const { getAllByText, getByText, getByPlaceholderText, queryByText } = renderScreen();
    pressSubmitButton(getAllByText);
    expect(getByText('First name is required')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText('John'), 'Jane');
    expect(queryByText('First name is required')).toBeNull();
  });

  it('calls register with correct args on valid form', async () => {
    mockRegister.mockResolvedValue('Check your email');
    const { getAllByText, getByPlaceholderText } = renderScreen();

    fillForm(getByPlaceholderText);

    await act(async () => {
      pressSubmitButton(getAllByText);
    });

    expect(mockRegister).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
    });
  });

  it('shows success Alert on successful registration', async () => {
    mockRegister.mockResolvedValue('Please verify your email');
    const { getAllByText, getByPlaceholderText } = renderScreen();

    fillForm(getByPlaceholderText);

    await act(async () => {
      pressSubmitButton(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Registration Successful',
      'Please verify your email',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Sign In' }),
      ]),
    );
  });

  it('Alert Sign In button navigates to Login', async () => {
    mockRegister.mockResolvedValue('ok');
    const { getAllByText, getByPlaceholderText } = renderScreen();

    fillForm(getByPlaceholderText);

    await act(async () => {
      pressSubmitButton(getAllByText);
    });

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    buttons[0].onPress();
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('shows API field errors', async () => {
    mockRegister.mockRejectedValue({
      message: 'Validation failed',
      errors: { username: 'Username already taken' },
    });
    const { getAllByText, getByText, getByPlaceholderText } = renderScreen();

    fillForm(getByPlaceholderText);

    await act(async () => {
      pressSubmitButton(getAllByText);
    });

    expect(getByText('Username already taken')).toBeTruthy();
    expect(getByText('Validation failed')).toBeTruthy();
  });

  it('shows fallback error message', async () => {
    mockRegister.mockRejectedValue({});
    const { getAllByText, getByText, getByPlaceholderText } = renderScreen();

    fillForm(getByPlaceholderText);

    await act(async () => {
      pressSubmitButton(getAllByText);
    });

    expect(getByText('Registration failed. Please try again.')).toBeTruthy();
  });

  it('navigates to Login on Sign In footer press', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
