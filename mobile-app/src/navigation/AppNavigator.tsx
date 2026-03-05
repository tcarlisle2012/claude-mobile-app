import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
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
          title: 'Users',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => (navigation as any).getParent()?.toggleDrawer()}
              style={styles.menuButton}
              activeOpacity={0.6}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        })}
      />
      <AdminStack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
        options={{ title: 'User Details' }}
      />
    </AdminStack.Navigator>
  );
}

function MainNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
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
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
        drawerType: 'front',
        overlayColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      {isAdmin && (
        <Drawer.Screen
          name="Users"
          component={AdminNavigator}
          options={{ headerShown: false }}
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
    marginLeft: 16,
    padding: 4,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
