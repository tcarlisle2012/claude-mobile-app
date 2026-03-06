import { Dimensions } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

describe('useBreakpoint', () => {
  let listeners: Array<(event: { window: { width: number; height: number } }) => void> = [];

  beforeEach(() => {
    listeners = [];
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 400,
      height: 800,
      scale: 1,
      fontScale: 1,
    });
    jest.spyOn(Dimensions, 'addEventListener').mockImplementation((_event, handler) => {
      listeners.push(handler as any);
      return { remove: () => { listeners = listeners.filter((l) => l !== handler); } };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns mobile for narrow widths', () => {
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('returns tablet for medium widths', () => {
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 800, height: 1024, scale: 1, fontScale: 1 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
  });

  it('returns desktop for wide widths', () => {
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 1280, height: 800, scale: 1, fontScale: 1 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');
    expect(result.current.isDesktop).toBe(true);
  });

  it('updates when dimensions change', () => {
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('mobile');

    act(() => {
      listeners.forEach((l) => l({ window: { width: 1280, height: 800 } }));
    });

    expect(result.current.breakpoint).toBe('desktop');
    expect(result.current.isDesktop).toBe(true);
  });

  it('cleans up listener on unmount', () => {
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
    const { unmount } = renderHook(() => useBreakpoint());
    expect(listeners).toHaveLength(1);
    unmount();
    expect(listeners).toHaveLength(0);
  });
});
