import React, { forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address';
  returnKeyType?: 'next' | 'go' | 'done';
  onSubmitEditing?: () => void;
};

const FormInput = forwardRef<TextInput, Props>(
  (
    {
      label,
      icon,
      value,
      onChangeText,
      error,
      placeholder,
      secureTextEntry = false,
      showPasswordToggle = false,
      showPassword = false,
      onTogglePassword,
      autoCapitalize = 'sentences',
      keyboardType = 'default',
      returnKeyType,
      onSubmitEditing,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <View style={[styles.inputRow, { borderColor: error ? colors.error : colors.border }]}>
          <Ionicons name={icon} size={18} color={colors.icon} style={styles.inputIcon} />
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry && !showPassword}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
            autoCorrect={false}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
          />
          {showPasswordToggle && onTogglePassword && (
            <TouchableOpacity
              onPress={onTogglePassword}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
        </View>
        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}
      </View>
    );
  },
);

FormInput.displayName = 'FormInput';

export default FormInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 48,
  },
  eyeButton: {
    padding: 8,
    marginRight: -4,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
