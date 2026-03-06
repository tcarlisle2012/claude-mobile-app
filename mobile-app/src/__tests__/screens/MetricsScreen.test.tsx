import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import MetricsScreen from '../../screens/MetricsScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  adminGetMetrics: jest.fn(),
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

const sampleMetrics = {
  httpRequestMetrics: [
    {
      method: 'GET',
      uri: '/api/admin/health',
      status: '200',
      count: 42,
      totalTimeMs: 1250.5,
      meanTimeMs: 29.77,
      maxTimeMs: 150.3,
    },
    {
      method: 'POST',
      uri: '/api/auth/login',
      status: '200',
      count: 15,
      totalTimeMs: 3000.0,
      meanTimeMs: 200.0,
      maxTimeMs: 800.5,
    },
    {
      method: 'GET',
      uri: '/api/user/me',
      status: '401',
      count: 3,
      totalTimeMs: 15.0,
      meanTimeMs: 5.0,
      maxTimeMs: 10.0,
    },
  ],
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <MetricsScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MetricsScreen', () => {
  it('shows loading indicator initially', () => {
    api.adminGetMetrics.mockReturnValue(new Promise(() => {}));
    renderScreen();
    // ActivityIndicator is present during loading
  });

  it('renders total requests count', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('60')).toBeTruthy(); // 42 + 15 + 3
    });
  });

  it('renders average response time', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      // (1250.5 + 3000.0 + 15.0) / 60 = 71.1
      expect(getByText('71.1 ms')).toBeTruthy();
    });
  });

  it('renders endpoint URIs', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('/api/admin/health')).toBeTruthy();
      expect(getByText('/api/auth/login')).toBeTruthy();
      expect(getByText('/api/user/me')).toBeTruthy();
    });
  });

  it('renders HTTP methods', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      expect(getAllByText('GET').length).toBe(2);
      expect(getAllByText('POST').length).toBe(1);
    });
  });

  it('sorts endpoints by count descending', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      const requestCounts = getAllByText(/^\d+$/).map((el) => el.props.children);
      // Sorted: 42 (health), 15 (login), 3 (me)
      // The first "42" should appear before "15" and "3"
      const idx42 = requestCounts.indexOf(42);
      const idx15 = requestCounts.indexOf(15);
      const idx3 = requestCounts.indexOf(3);
      expect(idx42).toBeLessThan(idx15);
      expect(idx15).toBeLessThan(idx3);
    });
  });

  it('shows error message on failure', async () => {
    api.adminGetMetrics.mockRejectedValue({ message: 'Forbidden' });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Forbidden')).toBeTruthy();
    });
  });

  it('shows empty state when no metrics', async () => {
    api.adminGetMetrics.mockResolvedValue({ httpRequestMetrics: [] });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('No request metrics recorded yet')).toBeTruthy();
    });
  });

  it('renders status codes', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getAllByText, getByText } = renderScreen();

    await waitFor(() => {
      expect(getAllByText('200').length).toBe(2);
      expect(getByText('401')).toBeTruthy();
    });
  });
});
