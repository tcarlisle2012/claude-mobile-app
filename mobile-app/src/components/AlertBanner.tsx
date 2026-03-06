import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  message: string;
  type: 'error' | 'success';
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function AlertBanner({ message, type, onRetry, retryLabel, style }: Props) {
  const { colors } = useTheme();

  const color = type === 'error' ? colors.error : colors.success;
  const backgroundColor = type === 'error' ? colors.errorBackground : colors.successBackground;
  const icon = type === 'error' ? 'alert-circle' : 'checkmark-circle';

  const content = (
    <>
      <Ionicons name={icon} size={18} color={color} />
      <View style={styles.textContainer}>
        <Text style={[styles.message, { color }]}>{message}</Text>
        {onRetry && retryLabel ? (
          <Text style={[styles.retry, { color }]}>{retryLabel}</Text>
        ) : null}
      </View>
    </>
  );

  const containerStyle = [styles.container, { backgroundColor }, style];

  if (onRetry) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onRetry}
        activeOpacity={0.7}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={retryLabel ? `${message}. ${retryLabel}` : message}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={containerStyle}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
  },
  retry: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
