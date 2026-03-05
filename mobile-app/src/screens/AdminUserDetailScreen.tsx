import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import * as api from '../services/api';

export default function AdminUserDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { userId } = route.params as { userId: number };
  const { colors } = useTheme();

  const [user, setUser] = useState<api.UserDto | null>(null);
  const [token, setToken] = useState<api.VerificationTokenDto | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tokenLoading, setTokenLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [userData, tokenData] = await Promise.all([
        api.adminGetUser(userId),
        api.adminGetToken(userId),
      ]);
      setUser(userData);
      setToken(tokenData);
      setForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email.trim()))
      errors.email = 'Please enter a valid email';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await api.adminUpdateUser(userId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      });
      setUser(updated);
      setSuccess('User updated successfully');
    } catch (err: any) {
      if (err?.errors) setFieldErrors(err.errors);
      setError(err?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      setError('');
      const updated = await api.adminToggleEnabled(userId);
      setUser(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle enabled status');
    }
  };

  const handleToggleLocked = async () => {
    try {
      setError('');
      const updated = await api.adminToggleLocked(userId);
      setUser(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle locked status');
    }
  };

  const handleDeleteToken = async () => {
    setTokenLoading(true);
    try {
      await api.adminDeleteToken(userId);
      setToken(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    setTokenLoading(true);
    try {
      const newToken = await api.adminRegenerateToken(userId);
      setToken(newToken);
    } catch (err: any) {
      setError(err?.message || 'Failed to regenerate token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user?.username}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.adminDeleteUser(userId);
              navigation.goBack();
            } catch (err: any) {
              setError(err?.message || 'Failed to delete user');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>User not found</Text>
      </View>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const editFields: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'email-address';
    autoCapitalize?: 'none' | 'words';
  }[] = [
    { key: 'firstName', label: 'First Name', icon: 'person-outline', autoCapitalize: 'words' },
    { key: 'lastName', label: 'Last Name', icon: 'person-outline', autoCapitalize: 'words' },
    { key: 'email', label: 'Email', icon: 'mail-outline', keyboardType: 'email-address', autoCapitalize: 'none' },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* User Header */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarLargeText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.text }]}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={[styles.headerUsername, { color: colors.textSecondary }]}>
                @{user.username}
              </Text>
              <View style={styles.badges}>
                {user.roles.map((role) => (
                  <View key={role} style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {role.replace('ROLE_', '')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
            Created: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Messages */}
        {error ? (
          <View style={[styles.messageBox, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={[styles.messageText, { color: '#DC2626' }]}>{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={[styles.messageBox, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            <Text style={[styles.messageText, { color: '#16A34A' }]}>{success}</Text>
          </View>
        ) : null}

        {/* Edit Profile */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {editFields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: fieldErrors[field.key] ? '#DC2626' : colors.border },
                ]}
              >
                <Ionicons name={field.icon} size={18} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={(form as any)[field.key]}
                  onChangeText={(v) => updateField(field.key, v)}
                  keyboardType={field.keyboardType ?? 'default'}
                  autoCapitalize={field.autoCapitalize ?? 'sentences'}
                  autoCorrect={false}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {fieldErrors[field.key] ? (
                <Text style={styles.fieldError}>{fieldErrors[field.key]}</Text>
              ) : null}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Status */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Status</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Account Enabled</Text>
              <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                User can log in when enabled
              </Text>
            </View>
            <Switch
              value={user.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Account Locked</Text>
              <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                Locked accounts cannot log in
              </Text>
            </View>
            <Switch
              value={!user.accountNonLocked}
              onValueChange={handleToggleLocked}
              trackColor={{ false: colors.border, true: '#DC2626' }}
            />
          </View>
        </View>

        {/* Verification Token */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Token</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {tokenLoading ? (
            <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
          ) : token ? (
            <>
              <View style={styles.tokenInfo}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Token</Text>
                <Text
                  style={[styles.tokenValue, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {token.token}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Expires</Text>
                <View style={styles.tokenExpiry}>
                  <Text style={[styles.tokenValue, { color: colors.text }]}>
                    {new Date(token.expiryDate).toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: token.expired ? '#FEE2E2' : '#DCFCE7', marginLeft: 8 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: token.expired ? '#DC2626' : '#16A34A' },
                      ]}
                    >
                      {token.expired ? 'Expired' : 'Active'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.tokenActions}>
                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: '#DC2626' }]}
                  onPress={handleDeleteToken}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.outlineButtonText, { color: '#DC2626' }]}>Delete Token</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: colors.primary }]}
                  onPress={handleRegenerateToken}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.outlineButtonText, { color: colors.primary }]}>
                    Resend Verification
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.noTokenText, { color: colors.textSecondary }]}>
                No verification token exists for this user.
              </Text>
              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: colors.primary, alignSelf: 'flex-start' }]}
                onPress={handleRegenerateToken}
                activeOpacity={0.7}
              >
                <Text style={[styles.outlineButtonText, { color: colors.primary }]}>
                  Generate New Token
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Danger Zone</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#DC2626', borderWidth: 1 }]}>
          <Text style={[styles.dangerHint, { color: colors.textSecondary }]}>
            Permanently delete this user and all associated data.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#DC2626' }]}
            onPress={handleDeleteUser}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Delete User</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerUsername: {
    fontSize: 14,
    marginTop: 2,
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
  createdAt: {
    fontSize: 13,
    marginTop: 12,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  messageText: {
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 48,
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  tokenInfo: {
    marginBottom: 12,
  },
  tokenValue: {
    fontSize: 14,
    marginTop: 2,
  },
  tokenExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  outlineButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noTokenText: {
    fontSize: 14,
    marginBottom: 12,
  },
  dangerHint: {
    fontSize: 14,
    marginBottom: 12,
  },
});
