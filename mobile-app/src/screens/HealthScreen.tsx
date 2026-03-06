import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import * as api from '../services/api';

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    if (value > 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)} GB`;
    }
    if (value > 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)} MB`;
    }
    return String(value);
  }
  return String(value);
}

const COMPONENT_LABELS: Record<string, string> = {
  db: 'components.db',
  diskSpace: 'components.diskSpace',
  mail: 'components.mail',
  ping: 'components.ping',
};

export default function HealthScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [health, setHealth] = useState<api.HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchHealth = useCallback(async () => {
    try {
      setError('');
      const data = await api.adminGetHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHealth();
    }, [fetchHealth]),
  );

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  const isUp = health?.status === 'UP';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Overall Status Banner */}
      <View
        style={[
          styles.statusBanner,
          { backgroundColor: isUp ? '#DEF7EC' : '#FDE8E8' },
        ]}
      >
        <Ionicons
          name={isUp ? 'checkmark-circle' : 'close-circle'}
          size={32}
          color={isUp ? '#03543F' : '#9B1C1C'}
        />
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusLabel, { color: isUp ? '#03543F' : '#9B1C1C' }]}>
            {t('health.overallStatus')}
          </Text>
          <Text style={[styles.statusValue, { color: isUp ? '#03543F' : '#9B1C1C' }]}>
            {isUp ? t('health.up') : t('health.down')}
          </Text>
        </View>
      </View>

      {/* Component Cards */}
      {health?.components &&
        Object.entries(health.components).map(([key, component]) => {
          const compUp = component.status === 'UP';
          const isExpanded = expanded[key] ?? false;
          const labelKey = COMPONENT_LABELS[key];
          const label = labelKey ? t(`health.${labelKey}`) : key;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => toggleExpanded(key)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: compUp ? '#10B981' : '#EF4444' },
                    ]}
                  />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{label}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.cardStatus,
                      { color: compUp ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {compUp ? t('health.up') : t('health.down')}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </View>

              {isExpanded && component.details && (
                <View style={[styles.detailsContainer, { borderTopColor: colors.border }]}>
                  {Object.entries(component.details).map(([dKey, dValue]) => (
                    <View key={dKey} style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: colors.textSecondary }]}>
                        {dKey}
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatValue(dValue)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

      {health?.components && Object.keys(health.components).length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('health.noComponents')}
        </Text>
      )}

      {/* View Metrics Button */}
      <TouchableOpacity
        style={[styles.metricsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('Metrics')}
        activeOpacity={0.7}
      >
        <Ionicons name="analytics-outline" size={24} color={colors.primary} />
        <Text style={[styles.metricsButtonText, { color: colors.primary }]}>
          {t('health.viewMetrics')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusTextContainer: {
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailKey: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },
  metricsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  metricsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
});
