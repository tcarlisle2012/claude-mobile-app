import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AdminStackParamList = {
  AdminUsers: undefined;
  AdminUserDetail: { userId: number };
};

type Props = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'AdminUsers'>;
};

export default function AdminUsersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [users, setUsers] = useState<api.UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const data = await api.adminGetUsers();
      setUsers(data);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('adminUsers.fallbackError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

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
            <View
              style={[
                styles.badge,
                { backgroundColor: item.enabled ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: item.enabled ? '#16A34A' : '#DC2626' },
                ]}
              >
                {item.enabled ? t('adminUsers.enabled') : t('adminUsers.disabled')}
              </Text>
            </View>
            {!item.accountNonLocked && (
              <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: '#DC2626' }]}>{t('adminUsers.locked')}</Text>
              </View>
            )}
            {isAdmin && (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{t('adminUsers.admin')}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <TouchableOpacity
          style={[styles.errorBox, { backgroundColor: '#FEE2E2' }]}
          onPress={fetchUsers}
          activeOpacity={0.7}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${error}. ${t('common.tapToRetry')}`}
        >
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <View style={styles.errorContent}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>{t('common.tapToRetry')}</Text>
          </View>
        </TouchableOpacity>
      ) : null}
      <FlatList
        data={users}
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
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('adminUsers.noUsersFound')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    gap: 8,
  },
  errorContent: {
    flex: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  retryText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
