import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
import HealthScreen from '../screens/HealthScreen';
import MetricsScreen from '../screens/MetricsScreen';
import CustomDrawerContent from './CustomDrawerContent';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Drawer = createDrawerNavigator();
const AuthStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AdminNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerShadowVisible: false,
      }}
    >
      <AdminStack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={({ navigation }) => ({
          title: t('navigation.users'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => (navigation as any).getParent()?.goBack()}
              style={styles.backButton}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.goBack')}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        })}
      />
      <AdminStack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
        options={{ title: t('navigation.userDetails') }}
      />
    </AdminStack.Navigator>
  );
}

function MainNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={styles.menuButton}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={t('navigation.openMenu')}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
        drawerType: 'front',
        overlayColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.goBack')}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        })}
      />
      {isAdmin && (
        <Drawer.Screen
          name="Users"
          component={AdminNavigator}
          options={{ headerShown: false }}
        />
      )}
      {isAdmin && (
        <Drawer.Screen
          name="Health"
          component={HealthScreen}
          options={({ navigation }) => ({
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={t('navigation.goBack')}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          })}
        />
      )}
      {isAdmin && (
        <Drawer.Screen
          name="Metrics"
          component={MetricsScreen}
          options={({ navigation }) => ({
            drawerItemStyle: { display: 'none' },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Health')}
                style={styles.backButton}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={t('navigation.goBack')}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          })}
        />
      )}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return user ? <MainNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 8,
    padding: 10,
  },
  backButton: {
    marginLeft: 0,
    padding: 10,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
