import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import * as api from '../services/api';

function getResponseTimeColor(ms: number): string {
  if (ms < 100) return '#10B981';
  if (ms < 500) return '#F59E0B';
  return '#EF4444';
}

export default function MetricsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<api.HttpRequestMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      setError('');
      const data = await api.adminGetMetrics();
      setMetrics(data.httpRequestMetrics);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMetrics();
    }, [fetchMetrics]),
  );

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

  if (metrics.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('metrics.noMetrics')}
        </Text>
      </View>
    );
  }

  const sorted = [...metrics].sort((a, b) => b.count - a.count);
  const totalRequests = metrics.reduce((sum, m) => sum + m.count, 0);
  const totalTime = metrics.reduce((sum, m) => sum + m.totalTimeMs, 0);
  const avgResponseTime =
    totalRequests > 0
      ? Math.round((totalTime / totalRequests) * 10) / 10
      : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="layers-outline" size={24} color={colors.primary} />
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {totalRequests}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {t('metrics.totalRequests')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="timer-outline" size={24} color={colors.primary} />
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {avgResponseTime} {t('metrics.ms')}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {t('metrics.avgResponseTime')}
          </Text>
        </View>
      </View>

      {/* Endpoint Cards */}
      {sorted.map((metric, index) => (
        <View
          key={`${metric.method}-${metric.uri}-${metric.status}-${index}`}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>{metric.method}</Text>
            </View>
            <Text
              style={[styles.uriText, { color: colors.text }]}
              numberOfLines={1}
            >
              {metric.uri}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                {
                  color: metric.status.startsWith('2') ? '#10B981' : '#EF4444',
                },
              ]}
            >
              {metric.status}
            </Text>
          </View>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {metric.count}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('metrics.count')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statValue,
                  { color: getResponseTimeColor(metric.meanTimeMs) },
                ]}
              >
                {metric.meanTimeMs} {t('metrics.ms')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('metrics.avgTime')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statValue,
                  { color: getResponseTimeColor(metric.maxTimeMs) },
                ]}
              >
                {metric.maxTimeMs} {t('metrics.ms')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('metrics.maxTime')}
              </Text>
            </View>
          </View>
        </View>
      ))}
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
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
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
    padding: 12,
    gap: 8,
  },
  methodBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  uriText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
