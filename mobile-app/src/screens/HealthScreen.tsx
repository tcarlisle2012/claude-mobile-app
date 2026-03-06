import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import * as api from '../services/api';

export default function HealthScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [health, setHealth] = useState<api.HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const fetchHealth = useCallback(async () => {
    try {
      setError('');
      const data = await api.adminGetHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('health.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchHealth();
    }, [fetchHealth]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHealth();
  }, [fetchHealth]);

  const toggleExpanded = (key: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'UP' ? '#16A34A' : '#DC2626';
  };

  const getStatusBg = (status: string) => {
    return status === 'UP' ? '#DCFCE7' : '#FEE2E2';
  };

  const formatDetailValue = (value: unknown): string => {
    if (typeof value === 'number') {
      if (value > 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2)} GB`;
      }
      if (value > 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)} MB`;
      }
      return String(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value ?? '-');
  };

  const getComponentDisplayName = (key: string): string => {
    const nameKey = `health.components.${key}`;
    const translated = t(nameKey);
    if (translated !== nameKey) return translated;
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {health && (
        <>
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: getStatusBg(health.status) },
            ]}
          >
            <Ionicons
              name={health.status === 'UP' ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={getStatusColor(health.status)}
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                {t('health.overallStatus')}
              </Text>
              <Text style={[styles.statusValue, { color: getStatusColor(health.status) }]}>
                {health.status === 'UP' ? t('health.up') : t('health.down')}
              </Text>
            </View>
          </View>

          {Object.keys(health.components).length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="pulse-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('health.noComponents')}
              </Text>
            </View>
          ) : (
            Object.entries(health.components).map(([key, component]) => {
              const isExpanded = expandedComponents.has(key);
              const hasDetails = component.details && Object.keys(component.details).length > 0;

              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.card, { backgroundColor: colors.surface }]}
                  onPress={() => hasDetails && toggleExpanded(key)}
                  activeOpacity={hasDetails ? 0.7 : 1}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(component.status) },
                        ]}
                      />
                      <Text style={[styles.componentName, { color: colors.text }]}>
                        {getComponentDisplayName(key)}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: getStatusBg(component.status) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: getStatusColor(component.status) },
                          ]}
                        >
                          {component.status === 'UP' ? t('health.up') : t('health.down')}
                        </Text>
                      </View>
                      {hasDetails && (
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.icon}
                          style={styles.chevron}
                        />
                      )}
                    </View>
                  </View>

                  {isExpanded && component.details && (
                    <View style={[styles.detailsContainer, { borderTopColor: colors.border }]}>
                      {Object.entries(component.details).map(([detailKey, detailValue]) => (
                        <View key={detailKey} style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: colors.textSecondary }]}>
                            {detailKey}
                          </Text>
                          <Text
                            style={[styles.detailValue, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {formatDetailValue(detailValue)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  componentName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 8,
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
