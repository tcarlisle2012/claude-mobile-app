import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const currentRoute =
    props.state.routes[props.state.index]?.name ?? 'Home';

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  const drawerItems: {
    label: string;
    route: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { label: 'Home', route: 'Home', icon: 'home-outline' },
    { label: 'Settings', route: 'Settings', icon: 'settings-outline' },
    ...(isAdmin
      ? [{ label: 'Users', route: 'Users', icon: 'people-outline' as keyof typeof Ionicons.glyphMap }]
      : []),
  ];

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.surface }}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View
          style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {initials}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user ? `${user.firstName} ${user.lastName}` : 'My App'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email ?? 'v1.0.0'}
        </Text>
      </View>

      <View style={styles.itemsContainer}>
        {drawerItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.item,
                isActive && {
                  backgroundColor: colors.drawerActiveBackground,
                },
              ]}
              onPress={() => props.navigation.navigate(item.route)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? colors.drawerActive : colors.icon}
              />
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: isActive ? colors.drawerActive : colors.text,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.logoutSection, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.6}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutLabel}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  itemsContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 2,
  },
  itemLabel: {
    fontSize: 15,
    marginLeft: 14,
  },
  logoutSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logoutLabel: {
    fontSize: 15,
    marginLeft: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});
