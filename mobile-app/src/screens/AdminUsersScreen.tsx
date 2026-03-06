import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LoadingScreen, AlertBanner, Badge, EmptyState } from '../components';
import useApiQuery from '../hooks/useApiQuery';
import * as api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'AdminUsers'>;
};

export default function AdminUsersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { data: users, loading, error, refreshing, onRefresh, refetch } = useApiQuery(
    useCallback(() => api.adminGetUsers(), []),
    t('adminUsers.fallbackError'),
  );

  const renderItem = ({ item }: { item: api.UserDto }) => {
    const initials = `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`.toUpperCase();
    const isAdmin = item.roles.includes('ROLE_ADMIN');

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{item.username}
          </Text>
          <View style={styles.badges}>
            <Badge
              label={item.enabled ? t('adminUsers.enabled') : t('adminUsers.disabled')}
              color={item.enabled ? colors.success : colors.error}
              backgroundColor={item.enabled ? colors.successBackground : colors.errorBackground}
            />
            {!item.accountNonLocked && (
              <Badge
                label={t('adminUsers.locked')}
                color={colors.error}
                backgroundColor={colors.errorBackground}
              />
            )}
            {isAdmin && (
              <Badge
                label={t('adminUsers.admin')}
                color={colors.primary}
                backgroundColor={colors.primaryLight}
              />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <AlertBanner
          type="error"
          message={error}
          onRetry={refetch}
          retryLabel={t('common.tapToRetry')}
          style={styles.errorBanner}
        />
      ) : null}
      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="people-outline" message={t('adminUsers.noUsersFound')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 13,
    marginTop: 1,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  errorBanner: {
    margin: 16,
    marginBottom: 0,
  },
});
