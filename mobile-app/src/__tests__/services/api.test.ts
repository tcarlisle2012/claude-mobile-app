import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  register,
  login,
  getMe,
  getStoredToken,
  clearToken,
  adminGetUsers,
  adminGetUser,
  adminUpdateUser,
  adminToggleEnabled,
  adminToggleLocked,
  adminDeleteUser,
  adminGetToken,
  adminDeleteToken,
  adminRegenerateToken,
} from '../../services/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.clear as jest.Mock)();
});

function mockResponse(data: any, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
  });
}

describe('Token management', () => {
  it('getStoredToken returns null when no token', async () => {
    const token = await getStoredToken();
    expect(token).toBeNull();
  });

  it('getStoredToken returns stored token', async () => {
    await AsyncStorage.setItem('auth_token', 'abc123');
    const token = await getStoredToken();
    expect(token).toBe('abc123');
  });

  it('clearToken removes the stored token', async () => {
    await AsyncStorage.setItem('auth_token', 'abc123');
    await clearToken();
    const token = await AsyncStorage.getItem('auth_token');
    expect(token).toBeNull();
  });

  it('login stores the access token', async () => {
    const authResponse = {
      accessToken: 'jwt-token-123',
      tokenType: 'Bearer',
      username: 'john',
      email: 'john@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    };
    mockResponse(authResponse);

    await login({ username: 'john', password: 'pass' });
    const stored = await AsyncStorage.getItem('auth_token');
    expect(stored).toBe('jwt-token-123');
  });
});

describe('Request building', () => {
  it('sends request to correct URL', async () => {
    mockResponse({ success: true, message: 'ok' });
    await register({
      username: 'john',
      email: 'j@test.com',
      password: 'pass1234',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.any(Object),
    );
  });

  it('includes Content-Type header', async () => {
    mockResponse({ success: true, message: 'ok' });
    await register({
      username: 'john',
      email: 'j@test.com',
      password: 'pass1234',
      firstName: 'John',
      lastName: 'Doe',
    });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('includes Bearer token when present', async () => {
    await AsyncStorage.setItem('auth_token', 'my-token');
    mockResponse({ username: 'john', email: 'j@test.com', firstName: 'John', lastName: 'Doe', roles: [] });
    await getMe();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-token');
  });

  it('omits Authorization header when no token', async () => {
    mockResponse({ username: 'john', email: 'j@test.com', firstName: 'John', lastName: 'Doe', roles: [] });
    await getMe();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('sends POST body as JSON', async () => {
    mockResponse({ success: true, message: 'ok' });
    const body = {
      username: 'john',
      email: 'j@test.com',
      password: 'pass1234',
      firstName: 'John',
      lastName: 'Doe',
    };
    await register(body);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(body);
  });
});

describe('Error handling', () => {
  it('throws parsed error on non-ok response', async () => {
    mockResponse({ success: false, message: 'Bad request' }, false, 400);
    await expect(
      register({
        username: 'john',
        email: 'j@test.com',
        password: 'pass1234',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toEqual({ success: false, message: 'Bad request' });
  });

  it('propagates network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(getMe()).rejects.toThrow('Network error');
  });
});

describe('Endpoint functions', () => {
  it('register calls POST /auth/register', async () => {
    mockResponse({ success: true, message: 'Registered' });
    const res = await register({
      username: 'john',
      email: 'j@test.com',
      password: 'pass1234',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(res).toEqual({ success: true, message: 'Registered' });
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/register');
  });

  it('login calls POST /auth/login and returns AuthResponse', async () => {
    const authRes = {
      accessToken: 'token',
      tokenType: 'Bearer',
      username: 'john',
      email: 'j@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ROLE_USER'],
    };
    mockResponse(authRes);
    const res = await login({ username: 'john', password: 'pass' });
    expect(res.username).toBe('john');
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/login');
  });

  it('getMe calls GET /user/me', async () => {
    mockResponse({ username: 'john', email: 'j@test.com', firstName: 'John', lastName: 'Doe', roles: [] });
    await getMe();
    expect(mockFetch.mock.calls[0][0]).toContain('/user/me');
  });

  it('adminGetUsers calls GET /admin/users', async () => {
    mockResponse([]);
    await adminGetUsers();
    expect(mockFetch.mock.calls[0][0]).toContain('/admin/users');
  });

  it('adminGetUser calls GET /admin/users/:id', async () => {
    mockResponse({ id: 1, username: 'john' });
    await adminGetUser(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/admin/users/1');
  });

  it('adminUpdateUser calls PUT /admin/users/:id', async () => {
    mockResponse({ id: 1, username: 'john' });
    await adminUpdateUser(1, { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/admin/users/1');
    expect(opts.method).toBe('PUT');
  });

  it('adminToggleEnabled calls PUT /admin/users/:id/toggle-enabled', async () => {
    mockResponse({ id: 1 });
    await adminToggleEnabled(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/admin/users/1/toggle-enabled');
    expect(opts.method).toBe('PUT');
  });

  it('adminToggleLocked calls PUT /admin/users/:id/toggle-locked', async () => {
    mockResponse({ id: 1 });
    await adminToggleLocked(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/admin/users/1/toggle-locked');
  });

  it('adminDeleteUser calls DELETE /admin/users/:id', async () => {
    mockResponse({ success: true, message: 'Deleted' });
    await adminDeleteUser(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/admin/users/1');
    expect(opts.method).toBe('DELETE');
  });

  it('adminGetToken returns token data', async () => {
    const tokenData = { id: 1, token: 'abc', expiryDate: '2025-01-01', expired: false };
    mockResponse(tokenData);
    const res = await adminGetToken(1);
    expect(res).toEqual(tokenData);
  });

  it('adminGetToken returns null when no token exists', async () => {
    mockResponse({ success: true, message: 'No token' });
    const res = await adminGetToken(1);
    expect(res).toBeNull();
  });

  it('adminDeleteToken calls DELETE /admin/users/:id/token', async () => {
    mockResponse({ success: true, message: 'Deleted' });
    await adminDeleteToken(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/admin/users/1/token');
    expect(opts.method).toBe('DELETE');
  });

  it('adminRegenerateToken calls POST /admin/users/:id/token', async () => {
    const tokenData = { id: 2, token: 'new-token', expiryDate: '2025-06-01', expired: false };
    mockResponse(tokenData);
    const res = await adminRegenerateToken(1);
    expect(res).toEqual(tokenData);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/admin/users/1/token');
    expect(opts.method).toBe('POST');
  });
});
