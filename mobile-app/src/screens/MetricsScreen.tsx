import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import * as api from '../services/api';

const getSpeedColor = (meanTimeMs: number): string => {
  if (meanTimeMs < 100) return '#16A34A';
  if (meanTimeMs < 500) return '#CA8A04';
  return '#DC2626';
};

const getSpeedBg = (meanTimeMs: number): string => {
  if (meanTimeMs < 100) return '#DCFCE7';
  if (meanTimeMs < 500) return '#FEF9C3';
  return '#FEE2E2';
};

const getMethodColor = (method: string): string => {
  switch (method) {
    case 'GET': return '#2563EB';
    case 'POST': return '#16A34A';
    case 'PUT': return '#CA8A04';
    case 'DELETE': return '#DC2626';
    default: return '#6B7280';
  }
};

export default function MetricsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<api.MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      setError('');
      const data = await api.adminGetMetrics();
      setMetrics(data);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('metrics.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchMetrics();
    }, [fetchMetrics]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMetrics();
  }, [fetchMetrics]);

  const totalRequests = metrics
    ? metrics.httpRequestMetrics.reduce((sum, m) => sum + m.count, 0)
    : 0;

  const avgResponseTime = metrics && totalRequests > 0
    ? metrics.httpRequestMetrics.reduce((sum, m) => sum + m.totalTimeMs, 0) / totalRequests
    : 0;

  const sortedMetrics = metrics
    ? [...metrics.httpRequestMetrics].sort((a, b) => b.count - a.count)
    : [];

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

      {metrics && (
        <>
          <View style={[styles.summaryRow]}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="swap-vertical-outline" size={24} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {totalRequests}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('metrics.totalRequests')}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="timer-outline" size={24} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {avgResponseTime.toFixed(1)} {t('metrics.ms')}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('metrics.avgResponseTime')}
              </Text>
            </View>
          </View>

          {sortedMetrics.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('metrics.noMetrics')}
              </Text>
            </View>
          ) : (
            sortedMetrics.map((metric, index) => (
              <View
                key={`${metric.method}-${metric.uri}-${metric.status}-${index}`}
                style={[styles.card, { backgroundColor: colors.surface }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.methodBadge, { backgroundColor: getMethodColor(metric.method) + '20' }]}>
                    <Text style={[styles.methodText, { color: getMethodColor(metric.method) }]}>
                      {metric.method}
                    </Text>
                  </View>
                  <Text style={[styles.uri, { color: colors.text }]} numberOfLines={1}>
                    {metric.uri}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: metric.status.startsWith('2') ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: metric.status.startsWith('2') ? '#16A34A' : '#DC2626' }]}>
                      {metric.status}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{metric.count}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('metrics.count')}</Text>
                  </View>
                  <View style={styles.stat}>
                    <View style={[styles.timeBadge, { backgroundColor: getSpeedBg(metric.meanTimeMs) }]}>
                      <Text style={[styles.timeValue, { color: getSpeedColor(metric.meanTimeMs) }]}>
                        {metric.meanTimeMs.toFixed(1)} {t('metrics.ms')}
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('metrics.avgTime')}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {metric.maxTimeMs.toFixed(1)} {t('metrics.ms')}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('metrics.maxTime')}</Text>
                  </View>
                </View>
              </View>
            ))
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
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
    padding: 14,
    gap: 8,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  uri: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
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
