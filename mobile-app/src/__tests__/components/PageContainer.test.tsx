import React from 'react';
import { Text } from 'react-native';
import PageContainer from '../../components/PageContainer';
import { renderWithTheme } from '../test-utils';

jest.mock('../../hooks/useBreakpoint', () => ({
  useBreakpoint: jest.fn(() => ({
    breakpoint: 'mobile',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  })),
}));

const { useBreakpoint } = require('../../hooks/useBreakpoint');

describe('PageContainer', () => {
  it('renders children', () => {
    const { getByText } = renderWithTheme(
      <PageContainer>
        <Text>Hello</Text>
      </PageContainer>,
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('applies desktop styles when on desktop', () => {
    (useBreakpoint as jest.Mock).mockReturnValue({
      breakpoint: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    const { toJSON } = renderWithTheme(
      <PageContainer>
        <Text>Desktop</Text>
      </PageContainer>,
    );

    const tree = toJSON() as any;
    const containerStyle = tree.props.style;
    const flatStyle = Array.isArray(containerStyle)
      ? Object.assign({}, ...containerStyle.filter(Boolean))
      : containerStyle;
    expect(flatStyle.maxWidth).toBe(960);
  });

  it('does not apply maxWidth on mobile', () => {
    (useBreakpoint as jest.Mock).mockReturnValue({
      breakpoint: 'mobile',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    const { toJSON } = renderWithTheme(
      <PageContainer>
        <Text>Mobile</Text>
      </PageContainer>,
    );

    const tree = toJSON() as any;
    const containerStyle = tree.props.style;
    const flatStyle = Array.isArray(containerStyle)
      ? Object.assign({}, ...containerStyle.filter(Boolean))
      : containerStyle;
    expect(flatStyle.maxWidth).toBeUndefined();
  });
});
