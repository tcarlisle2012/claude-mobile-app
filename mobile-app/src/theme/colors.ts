export const LightTheme = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F5',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  icon: '#6B7280',
  drawerActive: '#4F46E5',
  drawerActiveBackground: '#EEF2FF',
  statusBar: 'dark' as const,
};

export const DarkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  primary: '#818CF8',
  primaryLight: '#1E1B4B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  icon: '#94A3B8',
  drawerActive: '#818CF8',
  drawerActiveBackground: '#1E1B4B',
  statusBar: 'light' as const,
};

export type ThemeColors = Omit<typeof LightTheme, 'statusBar'> & {
  statusBar: 'light' | 'dark';
};
