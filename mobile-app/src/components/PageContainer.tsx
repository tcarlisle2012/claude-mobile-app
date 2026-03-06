import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';

interface PageContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function PageContainer({ children, style }: PageContainerProps) {
  const { isDesktop } = useBreakpoint();

  return (
    <View style={[styles.container, isDesktop && styles.desktop, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktop: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%' as unknown as number,
  },
});
