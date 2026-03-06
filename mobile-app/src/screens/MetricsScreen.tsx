import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LoadingScreen, AlertBanner, Card, Badge, EmptyState, PageContainer } from '../components';
import useApiQuery from '../hooks/useApiQuery';
import * as api from '../services/api';

export default function MetricsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { data: metrics, loading, error, refreshing, onRefresh, refetch } = useApiQuery(
    useCallback(() => api.adminGetMetrics(), []),
    t('metrics.loadError'),
  );

  const getSpeedColor = (meanTimeMs: number): string => {
    if (meanTimeMs < 100) return colors.success;
    if (meanTimeMs < 500) return colors.warning;
    return colors.error;
  };

  const getSpeedBg = (meanTimeMs: number): string => {
    if (meanTimeMs < 100) return colors.successBackground;
    if (meanTimeMs < 500) return colors.warningBackground;
    return colors.errorBackground;
  };

  const getMethodColor = (method: string): string => {
    switch (method) {
      case 'GET': return colors.methodGet;
      case 'POST': return colors.methodPost;
      case 'PUT': return colors.methodPut;
      case 'DELETE': return colors.methodDelete;
      default: return colors.methodDefault;
    }
  };

  const handleClearFailedAuth = useCallback(() => {
    Alert.alert(
      t('metrics.failedAuth.title'),
      t('metrics.failedAuth.clearConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('metrics.failedAuth.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.adminClearFailedAuth();
              refetch();
            } catch {}
          },
        },
      ],
    );
  }, [t, refetch]);

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
    return <LoadingScreen />;
  }

  return (
    <PageContainer>
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
        <AlertBanner
          type="error"
          message={error}
          onRetry={refetch}
          retryLabel={t('common.tapToRetry')}
        />
      ) : null}

      {metrics && (
        <>
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Ionicons name="swap-vertical-outline" size={24} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {totalRequests}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('metrics.totalRequests')}
              </Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Ionicons name="timer-outline" size={24} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {avgResponseTime.toFixed(1)} {t('metrics.ms')}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('metrics.avgResponseTime')}
              </Text>
            </Card>
          </View>

          {sortedMetrics.length === 0 ? (
            <EmptyState icon="analytics-outline" message={t('metrics.noMetrics')} />
          ) : (
            sortedMetrics.map((metric, index) => (
              <Card
                key={`${metric.method}-${metric.uri}-${metric.status}-${index}`}
                style={{ overflow: 'hidden' }}
              >
                <View style={styles.cardHeader}>
                  <Badge
                    label={metric.method}
                    color={getMethodColor(metric.method)}
                    backgroundColor={getMethodColor(metric.method) + '20'}
                    fontWeight="700"
                  />
                  <Text style={[styles.uri, { color: colors.text }]} numberOfLines={1}>
                    {metric.uri}
                  </Text>
                  <Badge
                    label={metric.status}
                    color={metric.status.startsWith('2') ? colors.success : colors.error}
                    backgroundColor={metric.status.startsWith('2') ? colors.successBackground : colors.errorBackground}
                    fontWeight="700"
                  />
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
              </Card>
            ))
          )}

          {metrics.failedAuthAttempts && metrics.failedAuthAttempts.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-outline" size={20} color={colors.error} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('metrics.failedAuth.title')}
                </Text>
                <Badge
                  label={String(metrics.failedAuthAttempts.length)}
                  color={colors.error}
                  backgroundColor={colors.errorBackground}
                  size="md"
                  fontWeight="700"
                />
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: colors.errorBackground }]}
                  onPress={handleClearFailedAuth}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                  <Text style={[styles.clearButtonText, { color: colors.error }]}>{t('metrics.failedAuth.clear')}</Text>
                </TouchableOpacity>
              </View>

              {metrics.failedAuthAttempts.map((attempt, index) => (
                <Card
                  key={`failed-${index}`}
                  style={{ overflow: 'hidden' }}
                >
                  <View style={styles.cardHeader}>
                    <Badge
                      label={attempt.method}
                      color={getMethodColor(attempt.method)}
                      backgroundColor={getMethodColor(attempt.method) + '20'}
                      fontWeight="700"
                    />
                    <Text style={[styles.uri, { color: colors.text }]} numberOfLines={1}>
                      {attempt.path}
                    </Text>
                    <Badge
                      label={String(attempt.status)}
                      color={colors.error}
                      backgroundColor={colors.errorBackground}
                      fontWeight="700"
                    />
                  </View>

                  <View style={[styles.failedAuthDetails, { borderTopColor: colors.border }]}>
                    <View style={styles.detailRow}>
                      <Ionicons name="globe-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        {t('metrics.failedAuth.ipAddress')}
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {attempt.ipAddress}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        {t('metrics.failedAuth.time')}
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {new Date(attempt.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          ) : metrics.failedAuthAttempts ? (
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {t('metrics.failedAuth.noAttempts')}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
    </PageContainer>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  uri: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  failedAuthDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
