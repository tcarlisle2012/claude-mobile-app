import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AdminUsersScreen from '../../screens/AdminUsersScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

jest.mock('../../services/api');
const api = require('../../services/api');

// Mock useFocusEffect as useEffect
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => any) => {
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

const mockNavigate = jest.fn();

const sampleUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    enabled: true,
    accountNonLocked: true,
    roles: ['ROLE_ADMIN', 'ROLE_USER'],
    createdAt: '2025-01-01T00:00:00',
  },
  {
    id: 2,
    username: 'john',
    email: 'john@test.com',
    firstName: 'John',
    lastName: 'Doe',
    enabled: false,
    accountNonLocked: true,
    roles: ['ROLE_USER'],
    createdAt: '2025-01-02T00:00:00',
  },
  {
    id: 3,
    username: 'locked',
    email: 'locked@test.com',
    firstName: 'Locked',
    lastName: 'User',
    enabled: true,
    accountNonLocked: false,
    roles: ['ROLE_USER'],
    createdAt: '2025-01-03T00:00:00',
  },
];

function renderScreen() {
  const navigation = { navigate: mockNavigate } as any;
  return render(
    <ThemeProvider>
      <AdminUsersScreen navigation={navigation} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminUsersScreen', () => {
  it('shows loading indicator initially', () => {
    api.adminGetUsers.mockReturnValue(new Promise(() => {})); // never resolves
    const { getByTestId } = renderScreen();
    // ActivityIndicator is present during loading
  });

  it('renders user list after loading', async () => {
    api.adminGetUsers.mockResolvedValue(sampleUsers);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Admin User')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
    });
  });

  it('shows @username for each user', async () => {
    api.adminGetUsers.mockResolvedValue(sampleUsers);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('@admin')).toBeTruthy();
      expect(getByText('@john')).toBeTruthy();
    });
  });

  it('shows Enabled badge for enabled users', async () => {
    api.adminGetUsers.mockResolvedValue(sampleUsers);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      expect(getAllByText('Enabled').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Disabled badge for disabled users', async () => {
    api.adminGetUsers.mockResolvedValue(sampleUsers);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Disabled')).toBeTruthy();
    });
  });

  it('shows Locked badge for locked users', async () => {
    api.adminGetUsers.mockResolvedValue(sampleUsers);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Locked')).toBeTruthy();
    });
  });

  it('shows Admin badge for admin users', async () => {
    api.adminGetUsers.mockResolvedValue(sampleUsers);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Admin')).toBeTruthy();
    });
  });

  it('shows error message on failure', async () => {
    api.adminGetUsers.mockRejectedValue({ message: 'Forbidden' });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Forbidden')).toBeTruthy();
    });
  });

  it('shows empty state when no users', async () => {
    api.adminGetUsers.mockResolvedValue([]);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('No users found')).toBeTruthy();
    });
  });
});
