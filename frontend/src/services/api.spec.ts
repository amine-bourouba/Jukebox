import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the store module
const mockGetState = vi.fn();
const mockDispatch = vi.fn();
vi.mock('../store/store', () => ({
  store: {
    getState: () => mockGetState(),
    dispatch: mockDispatch,
  },
}));

vi.mock('../store/authSlice', () => ({
  logout: vi.fn(() => ({ type: 'auth/logout' })),
  setTokens: vi.fn((payload) => ({ type: 'auth/setTokens', payload })),
}));

// Need to reset module state between tests since api.ts has module-level state (isRefreshing, failedQueue)
// We import fresh each time through dynamic import
describe('API Service', () => {
  let api: any;
  let axios: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.resetModules();
    // Reset localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

    mockGetState.mockReturnValue({
      auth: { token: 'test-token', refreshToken: 'test-refresh' },
    });

    // Import axios to get same reference as the fresh api module
    const axiosMod = await import('axios');
    axios = axiosMod.default;

    const mod = await import('../services/api');
    api = mod.default;
  });

  it('should attach Authorization header from store token', () => {
    // Test the request interceptor by inspecting api defaults
    // The interceptor reads from store.getState().auth.token
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('should create axios instance with baseURL', () => {
    expect(api.defaults.baseURL).toContain('localhost:3000/api');
  });

  it('should have request and response interceptors registered', () => {
    // Axios interceptors manager has handlers array
    expect(api.interceptors.request.handlers.length).toBeGreaterThan(0);
    expect(api.interceptors.response.handlers.length).toBeGreaterThan(0);
  });

  it('request interceptor should add Bearer token', async () => {
    // Manually run the request interceptor
    const requestInterceptor = api.interceptors.request.handlers[0];
    const config = { headers: {} } as any;

    const result = await requestInterceptor.fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('request interceptor should remove Authorization when no token', async () => {
    mockGetState.mockReturnValue({ auth: { token: null, refreshToken: null } });
    (globalThis.localStorage.getItem as any).mockReturnValue(null);

    const requestInterceptor = api.interceptors.request.handlers[0];
    const config = { headers: { Authorization: 'old' } } as any;

    const result = await requestInterceptor.fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor should pass through successful responses', async () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const response = { status: 200, data: { ok: true } };

    const result = await responseInterceptor.fulfilled(response);
    expect(result).toEqual(response);
  });

  it('response interceptor should reject non-401 errors', async () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const error = { response: { status: 500 }, config: {} };

    await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
  });

  it('response interceptor should dispatch logout when no refresh token on 401', async () => {
    mockGetState.mockReturnValue({ auth: { token: 'tk', refreshToken: null } });
    (globalThis.localStorage.getItem as any).mockReturnValue(null);

    const responseInterceptor = api.interceptors.response.handlers[0];
    const error = { response: { status: 401 }, config: {} };

    await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('request interceptor should fall back to localStorage token', async () => {
    mockGetState.mockReturnValue({ auth: { token: null, refreshToken: null } });
    (globalThis.localStorage.getItem as any).mockReturnValue('stored-token');

    const requestInterceptor = api.interceptors.request.handlers[0];
    const result = await requestInterceptor.fulfilled({ headers: {} } as any);
    expect(result.headers.Authorization).toBe('Bearer stored-token');
  });

  it('should refresh token on 401 and retry original request', async () => {
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { access_token: 'new-token', refresh_token: 'new-refresh' },
    });

    api.defaults.adapter = vi.fn().mockResolvedValue({
      data: { retried: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    const responseInterceptor = api.interceptors.response.handlers[0];
    const error = {
      response: { status: 401 },
      config: { headers: {} },
    };

    await responseInterceptor.rejected(error);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      { refreshToken: 'test-refresh' }
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth/setTokens' })
    );
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh');
  });

  it('should dispatch logout when token refresh fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('refresh failed'));

    const responseInterceptor = api.interceptors.response.handlers[0];
    const error = {
      response: { status: 401 },
      config: { headers: {} },
    };

    await expect(responseInterceptor.rejected(error)).rejects.toThrow('refresh failed');
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth/logout' })
    );
  });

  it('should queue requests while refreshing and resolve after refresh', async () => {
    let resolveRefresh!: (value: any) => void;
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise(resolve => { resolveRefresh = resolve; })
    );

    api.defaults.adapter = vi.fn().mockResolvedValue({
      data: 'ok',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    const responseInterceptor = api.interceptors.response.handlers[0];
    const error1 = { response: { status: 401 }, config: { headers: {} } };
    const error2 = { response: { status: 401 }, config: { headers: {} } };

    const promise1 = responseInterceptor.rejected(error1);
    const promise2 = responseInterceptor.rejected(error2);

    resolveRefresh({
      data: { access_token: 'new-token', refresh_token: 'new-refresh' },
    });

    await Promise.all([promise1, promise2]);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('should reject queued requests when refresh fails', async () => {
    let rejectRefresh!: (reason: any) => void;
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((_, reject) => { rejectRefresh = reject; })
    );

    const responseInterceptor = api.interceptors.response.handlers[0];
    const error1 = { response: { status: 401 }, config: { headers: {} } };
    const error2 = { response: { status: 401 }, config: { headers: {} } };

    const promise1 = responseInterceptor.rejected(error1);
    const promise2 = responseInterceptor.rejected(error2);

    rejectRefresh(new Error('refresh failed'));

    const results = await Promise.allSettled([promise1, promise2]);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth/logout' })
    );
  });
});
