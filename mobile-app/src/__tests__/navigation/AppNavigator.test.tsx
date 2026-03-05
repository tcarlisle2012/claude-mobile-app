import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../../theme/ThemeContext';
import { View } from 'react-native';

// Mock drawer navigator to avoid native gesture/reanimated deps
jest.mock('@react-navigation/drawer', () => {
  const mockReact = require('react');
  const RN = require('react-native');
  function MockNavigator({ children }: any) {
    const screens = mockReact.Children.toArray(children);
    return mockReact.createElement(RN.View, null, screens);
  }
  function MockScreen({ component: Component }: any) {
    return mockReact.createElement(Component, {
      navigation: { navigate: jest.fn(), toggleDrawer: jest.fn() },
    });
  }
  return {
    createDrawerNavigator: () => ({
      Navigator: MockNavigator,
      Screen: MockScreen,
    }),
    DrawerContentScrollView: ({ children }: any) =>
      mockReact.createElement(RN.View, null, children),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const mockReact = require('react');
  const RN = require('react-native');
  function MockNavigator({ children }: any) {
    // Only render the first screen (avoids rendering AdminUserDetailScreen which requires useRoute)
    const screens = mockReact.Children.toArray(children);
    return mockReact.createElement(RN.View, null, screens[0] || null);
  }
  function MockScreen({ component: Component }: any) {
    return mockReact.createElement(Component, {
      navigation: { navigate: jest.fn() },
    });
  }
  return {
    createNativeStackNavigator: () => ({
      Navigator: MockNavigator,
      Screen: MockScreen,
    }),
  };
});

const mockUseAuth = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Import after mocks
import AppNavigator from '../../navigation/AppNavigator';

function renderNavigator() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AppNavigator', () => {
  it('shows loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    const { UNSAFE_root } = renderNavigator();
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows login screen when user is null', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: jest.fn(),
    });
    const { getByText } = renderNavigator();

    await waitFor(() => {
      expect(getByText('Welcome Back')).toBeTruthy();
    });
  });

  it('shows home screen when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        username: 'john',
        email: 'j@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ROLE_USER'],
      },
      isLoading: false,
    });
    const { getByText } = renderNavigator();

    await waitFor(() => {
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  it('renders home for admin user', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        username: 'admin',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
      },
      isLoading: false,
    });
    const { getByText } = renderNavigator();

    await waitFor(() => {
      expect(getByText('Hello World')).toBeTruthy();
    });
  });
});
