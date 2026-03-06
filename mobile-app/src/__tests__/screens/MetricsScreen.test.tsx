import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import MetricsScreen from '../../screens/MetricsScreen';
import { ThemeProvider } from '../../theme/ThemeContext';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  adminGetMetrics: jest.fn(),
  adminClearFailedAuth: jest.fn(),
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
  failedAuthAttempts: [
    {
      ipAddress: '192.168.1.100',
      method: 'POST',
      path: '/api/auth/login',
      status: 401,
      timestamp: '2026-03-06T10:30:00Z',
    },
    {
      ipAddress: '10.0.0.5',
      method: 'GET',
      path: '/api/admin/users',
      status: 403,
      timestamp: '2026-03-06T10:25:00Z',
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
    const { getByText, getAllByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('/api/admin/health')).toBeTruthy();
      // /api/auth/login appears in both httpRequestMetrics and failedAuthAttempts
      expect(getAllByText('/api/auth/login').length).toBe(2);
      expect(getByText('/api/user/me')).toBeTruthy();
    });
  });

  it('renders HTTP methods', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      // GET: 2 in httpRequestMetrics + 1 in failedAuthAttempts = 3
      expect(getAllByText('GET').length).toBe(3);
      // POST: 1 in httpRequestMetrics + 1 in failedAuthAttempts = 2
      expect(getAllByText('POST').length).toBe(2);
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
    api.adminGetMetrics.mockResolvedValue({ httpRequestMetrics: [], failedAuthAttempts: [] });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('No request metrics recorded yet')).toBeTruthy();
    });
  });

  it('renders status codes', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      expect(getAllByText('200').length).toBe(2);
      // 401 appears in both httpRequestMetrics and failedAuthAttempts
      expect(getAllByText('401').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders failed auth section title', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Failed Authentication Attempts')).toBeTruthy();
    });
  });

  it('renders IP addresses for failed attempts', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('192.168.1.100')).toBeTruthy();
      expect(getByText('10.0.0.5')).toBeTruthy();
    });
  });

  it('renders paths for failed attempts', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getAllByText } = renderScreen();

    await waitFor(() => {
      // /api/auth/login appears in both httpRequestMetrics and failedAuthAttempts
      expect(getAllByText('/api/auth/login').length).toBe(2);
      expect(getAllByText('/api/admin/users').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders failed auth attempt count badge', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('2')).toBeTruthy(); // count badge showing 2 failed attempts
    });
  });

  it('shows no failed attempts message when array is empty', async () => {
    api.adminGetMetrics.mockResolvedValue({
      ...sampleMetrics,
      failedAuthAttempts: [],
    });
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('No failed authentication attempts')).toBeTruthy();
    });
  });

  it('renders clear button when failed attempts exist', async () => {
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Clear')).toBeTruthy();
    });
  });

  it('shows confirmation alert when clear button is pressed', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    api.adminGetMetrics.mockResolvedValue(sampleMetrics);
    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Clear')).toBeTruthy();
    });

    fireEvent.press(getByText('Clear'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Failed Authentication Attempts',
      'Are you sure you want to clear all failed authentication attempts?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Clear', style: 'destructive' }),
      ]),
    );

    alertSpy.mockRestore();
  });
});
