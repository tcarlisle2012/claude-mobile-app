import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();

  const options: { label: string; value: 'light' | 'dark' | 'system' }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {options.map((opt, index) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              index < options.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => setMode(opt.value)}
            activeOpacity={0.6}
          >
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              {opt.label}
            </Text>
            <View
              style={[
                styles.radio,
                { borderColor: mode === opt.value ? colors.primary : colors.border },
              ]}
            >
              {mode === opt.value && (
                <View
                  style={[styles.radioFill, { backgroundColor: colors.primary }]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
