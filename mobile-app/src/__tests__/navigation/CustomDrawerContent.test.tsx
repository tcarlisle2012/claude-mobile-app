import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeContext';
import { View } from 'react-native';

// Mock drawer to avoid native SafeArea/gesture deps
jest.mock('@react-navigation/drawer', () => {
  const RN = require('react-native');
  return {
    DrawerContentScrollView: ({ children, ...props }: any) => (
      <RN.View {...props}>{children}</RN.View>
    ),
    createDrawerNavigator: () => ({
      Navigator: RN.View,
      Screen: RN.View,
    }),
  };
});

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

let mockUser: any = {
  username: 'john',
  email: 'john@test.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: ['ROLE_USER'],
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

import CustomDrawerContent from '../../navigation/CustomDrawerContent';

function renderDrawer(isAdmin = false) {
  if (isAdmin) {
    mockUser = {
      username: 'admin',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
    };
  } else {
    mockUser = {
      username: 'john',
      email: 'john@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    };
  }

  const props = {
    state: {
      index: 0,
      routes: [{ name: 'Home', key: 'home-1' }],
      routeNames: ['Home', 'Settings'],
      key: 'drawer-1',
      type: 'drawer' as const,
      stale: false as const,
    },
    navigation: { navigate: mockNavigate } as any,
    descriptors: {} as any,
  };

  return render(
    <ThemeProvider>
      <CustomDrawerContent {...props} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CustomDrawerContent', () => {
  it('shows user initials', () => {
    const { getByText } = renderDrawer();
    expect(getByText('JD')).toBeTruthy();
  });

  it('shows user name and email', () => {
    const { getByText } = renderDrawer();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@test.com')).toBeTruthy();
  });

  it('shows Home and Settings items', () => {
    const { getByText } = renderDrawer();
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('does not show Users item for non-admin', () => {
    const { queryByText } = renderDrawer(false);
    expect(queryByText('Users')).toBeNull();
  });

  it('shows Users item for admin user', () => {
    const { getByText } = renderDrawer(true);
    expect(getByText('Users')).toBeTruthy();
  });

  it('calls logout on Sign Out press', () => {
    const { getByText } = renderDrawer();
    fireEvent.press(getByText('Sign Out'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
