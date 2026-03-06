import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LoadingScreen, AlertBanner, Badge, EmptyState, PageContainer } from '../components';
import useApiQuery from '../hooks/useApiQuery';
import type { DrawerParamList } from '../navigation/types';
import * as api from '../services/api';

export default function HealthScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<DrawerParamList>>();
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const { data: health, loading, error, refreshing, onRefresh, refetch } = useApiQuery(
    useCallback(() => api.adminGetHealth(), []),
    t('health.loadError'),
  );

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
    return status === 'UP' ? colors.success : colors.error;
  };

  const getStatusBg = (status: string) => {
    return status === 'UP' ? colors.successBackground : colors.errorBackground;
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
            <EmptyState icon="pulse-outline" message={t('health.noComponents')} />
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
                      <Badge
                        label={component.status === 'UP' ? t('health.up') : t('health.down')}
                        color={getStatusColor(component.status)}
                        backgroundColor={getStatusBg(component.status)}
                        size="md"
                        fontWeight="700"
                      />
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

          <TouchableOpacity
            style={[styles.metricsButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Metrics')}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics-outline" size={22} color={colors.primary} />
            <Text style={[styles.metricsButtonText, { color: colors.primary }]}>
              {t('health.viewMetrics')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
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
  metricsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
