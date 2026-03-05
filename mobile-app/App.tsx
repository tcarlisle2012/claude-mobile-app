import './src/i18n/i18n';
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { colors, isDark } = useTheme();

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      };

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style={colors.statusBar} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
