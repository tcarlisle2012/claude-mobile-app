import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { changeLanguage, resetToDeviceLanguage, isUsingSystemLanguage, LANGUAGES, getCurrentLanguage } from '../i18n/i18n';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { t } = useTranslation();
  const [systemLanguage, setSystemLanguage] = useState(true);

  useEffect(() => {
    isUsingSystemLanguage().then(setSystemLanguage);
  }, []);

  const options: { label: string; value: 'light' | 'dark' | 'system' }[] = [
    { label: t('settings.light'), value: 'light' },
    { label: t('settings.dark'), value: 'dark' },
    { label: t('settings.system'), value: 'system' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('settings.appearance')}</Text>
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
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === opt.value }}
            accessibilityLabel={opt.label}
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

      <Text style={[styles.heading, { color: colors.text }]}>{t('settings.language')}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.option,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => {
            resetToDeviceLanguage();
            setSystemLanguage(true);
          }}
          activeOpacity={0.6}
          accessibilityRole="radio"
          accessibilityState={{ checked: systemLanguage }}
          accessibilityLabel={t('settings.systemLanguage')}
        >
          <Text style={[styles.optionLabel, { color: colors.text }]}>
            {t('settings.systemLanguage')}
          </Text>
          <View
            style={[
              styles.radio,
              { borderColor: systemLanguage ? colors.primary : colors.border },
            ]}
          >
            {systemLanguage && (
              <View
                style={[styles.radioFill, { backgroundColor: colors.primary }]}
              />
            )}
          </View>
        </TouchableOpacity>
        {LANGUAGES.map((lang, index) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.option,
              index < LANGUAGES.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => {
              changeLanguage(lang.code);
              setSystemLanguage(false);
            }}
            activeOpacity={0.6}
            accessibilityRole="radio"
            accessibilityState={{ checked: !systemLanguage && getCurrentLanguage() === lang.code }}
            accessibilityLabel={lang.nativeLabel}
          >
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              {lang.nativeLabel}
            </Text>
            <View
              style={[
                styles.radio,
                { borderColor: !systemLanguage && getCurrentLanguage() === lang.code ? colors.primary : colors.border },
              ]}
            >
              {!systemLanguage && getCurrentLanguage() === lang.code && (
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
    marginBottom: 24,
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
