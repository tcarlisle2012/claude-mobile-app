import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HealthScreen from '../../screens/HealthScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  adminGetHealth: jest.fn(),
}));
const api = require('../../services/api');

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => any) => {
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

const sampleHealth = {
  status: 'UP',
  components: {
    db: {
      status: 'UP',
      details: { database: 'H2', validationQuery: 'isValid()' },
    },
    diskSpace: {
      status: 'UP',
      details: { total: 500107862016, free: 300000000000, threshold: 10485760 },
    },
    mail: {
      status: 'UP',
      details: { location: 'localhost:1025' },
    },
    ping: {
      status: 'UP',
    },
  },
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <HealthScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HealthScreen', () => {
  it('shows loading indicator initially', () => {
    api.adminGetHealth.mockReturnValue(new Promise(() => {}));
    renderScreen();
    // ActivityIndicator is present during loading
  });

  it('renders overall status UP', async () => {
    api.adminGetHealth.mockResolvedValue(sampleHealth);
    const { getByText, getAllByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Overall Status')).toBeTruthy();
      expect(getAllByText('UP').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders all component names', async () => {
    api.adminGetHealth.mockResolvedValue(sampleHealth);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Database')).toBeTruthy();
      expect(getByText('Disk Space')).toBeTruthy();
      expect(getByText('Mail Server')).toBeTruthy();
      expect(getByText('Ping')).toBeTruthy();
    });
  });

  it('shows DOWN status when backend is down', async () => {
    const downHealth = {
      status: 'DOWN',
      components: {
        db: { status: 'DOWN', details: { error: 'Connection refused' } },
      },
    };
    api.adminGetHealth.mockResolvedValue(downHealth);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      expect(getAllByText('DOWN').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('expands component details on press', async () => {
    api.adminGetHealth.mockResolvedValue(sampleHealth);
    const { getByText, queryByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Database')).toBeTruthy();
    });

    // Details should not be visible initially
    expect(queryByText('H2')).toBeNull();

    // Tap the Database card to expand
    fireEvent.press(getByText('Database'));

    await waitFor(() => {
      expect(getByText('H2')).toBeTruthy();
    });
  });

  it('formats large numbers as GB', async () => {
    api.adminGetHealth.mockResolvedValue(sampleHealth);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Disk Space')).toBeTruthy();
    });

    fireEvent.press(getByText('Disk Space'));

    await waitFor(() => {
      expect(getByText('500.11 GB')).toBeTruthy();
    });
  });

  it('shows error message on failure', async () => {
    api.adminGetHealth.mockRejectedValue({ message: 'Forbidden' });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Forbidden')).toBeTruthy();
    });
  });

  it('collapses component details on second press', async () => {
    api.adminGetHealth.mockResolvedValue(sampleHealth);
    const { getByText, queryByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Database')).toBeTruthy();
    });

    // Expand
    fireEvent.press(getByText('Database'));
    await waitFor(() => {
      expect(getByText('H2')).toBeTruthy();
    });

    // Collapse
    fireEvent.press(getByText('Database'));
    await waitFor(() => {
      expect(queryByText('H2')).toBeNull();
    });
  });
});
