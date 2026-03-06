import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const { colors } = useTheme();

  const isOutline = variant === 'outline';
  const bgColor = variant === 'danger' ? colors.error : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline
          ? { borderWidth: 1, borderColor: bgColor }
          : { backgroundColor: bgColor, opacity: loading || disabled ? 0.6 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: loading || disabled }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? bgColor : colors.buttonText} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: isOutline ? bgColor : colors.buttonText },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
