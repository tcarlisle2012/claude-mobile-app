import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { Card } from '../components';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.card}>
        <Text style={[styles.greeting, { color: colors.primary }]}>
          {t('home.greeting')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('home.subtitle')}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    borderRadius: 20,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '400',
  },
});
