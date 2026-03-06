import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LoadingScreen, AlertBanner, Card, Badge, Button, FormInput } from '../components';
import type { AdminStackParamList } from '../navigation/types';
import * as api from '../services/api';

type EditFormFields = 'firstName' | 'lastName' | 'email';
type EditFormState = Record<EditFormFields, string>;

export default function AdminUserDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const route = useRoute<RouteProp<AdminStackParamList, 'AdminUserDetail'>>();
  const { userId } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [user, setUser] = useState<api.UserDto | null>(null);
  const [token, setToken] = useState<api.VerificationTokenDto | null>(null);
  const [form, setForm] = useState<EditFormState>({ firstName: '', lastName: '', email: '' });
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
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('adminUserDetail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateField = (key: EditFormFields, value: string) => {
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
    if (!form.firstName.trim()) errors.firstName = t('adminUserDetail.validation.firstNameRequired');
    if (!form.lastName.trim()) errors.lastName = t('adminUserDetail.validation.lastNameRequired');
    if (!form.email.trim()) errors.email = t('adminUserDetail.validation.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email.trim()))
      errors.email = t('adminUserDetail.validation.emailInvalid');
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
      setSuccess(t('adminUserDetail.updateSuccess'));
    } catch (err: unknown) {
      const fieldErrs = api.getFieldErrors(err);
      if (fieldErrs) setFieldErrors(fieldErrs);
      setError(api.getErrorMessage(err) || t('adminUserDetail.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      setError('');
      const updated = await api.adminToggleEnabled(userId);
      setUser(updated);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('adminUserDetail.toggleEnabledError'));
    }
  };

  const handleToggleLocked = async () => {
    try {
      setError('');
      const updated = await api.adminToggleLocked(userId);
      setUser(updated);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('adminUserDetail.toggleLockedError'));
    }
  };

  const handleDeleteToken = async () => {
    setTokenLoading(true);
    try {
      await api.adminDeleteToken(userId);
      setToken(null);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('adminUserDetail.deleteTokenError'));
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    setTokenLoading(true);
    try {
      const newToken = await api.adminRegenerateToken(userId);
      setToken(newToken);
    } catch (err: unknown) {
      setError(api.getErrorMessage(err) || t('adminUserDetail.regenerateTokenError'));
    } finally {
      setTokenLoading(false);
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      t('adminUserDetail.deleteUserTitle'),
      t('adminUserDetail.deleteUserConfirm', { username: user?.username }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.adminDeleteUser(userId);
              navigation.goBack();
            } catch (err: unknown) {
              setError(api.getErrorMessage(err) || t('adminUserDetail.deleteUserError'));
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>{t('adminUserDetail.userNotFound')}</Text>
      </View>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const editFields: {
    key: EditFormFields;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'email-address';
    autoCapitalize?: 'none' | 'words';
  }[] = [
    { key: 'firstName', label: t('adminUserDetail.firstNameLabel'), icon: 'person-outline', autoCapitalize: 'words' },
    { key: 'lastName', label: t('adminUserDetail.lastNameLabel'), icon: 'person-outline', autoCapitalize: 'words' },
    { key: 'email', label: t('adminUserDetail.emailLabel'), icon: 'mail-outline', keyboardType: 'email-address', autoCapitalize: 'none' },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* User Header */}
        <Card style={styles.cardPadded}>
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
                  <Badge
                    key={role}
                    label={role.replace('ROLE_', '')}
                    color={colors.primary}
                    backgroundColor={colors.primaryLight}
                  />
                ))}
              </View>
            </View>
          </View>
          <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
            Created: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </Card>

        {/* Messages */}
        {error ? (
          <AlertBanner type="error" message={error} style={styles.messageBanner} />
        ) : null}
        {success ? (
          <AlertBanner type="success" message={success} style={styles.messageBanner} />
        ) : null}

        {/* Edit Profile */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('adminUserDetail.editProfile')}</Text>
        <Card style={styles.cardPadded}>
          {editFields.map((field) => (
            <FormInput
              key={field.key}
              label={field.label}
              icon={field.icon}
              value={form[field.key]}
              onChangeText={(v) => updateField(field.key, v)}
              error={fieldErrors[field.key]}
              keyboardType={field.keyboardType}
              autoCapitalize={field.autoCapitalize}
            />
          ))}
          <Button
            title={t('adminUserDetail.saveChanges')}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </Card>

        {/* Account Status */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('adminUserDetail.accountStatus')}</Text>
        <Card style={styles.cardPadded}>
          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t('adminUserDetail.accountEnabled')}</Text>
              <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                {t('adminUserDetail.enabledHint')}
              </Text>
            </View>
            <Switch
              value={user.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              accessibilityLabel={t('adminUserDetail.accountEnabled')}
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t('adminUserDetail.accountLocked')}</Text>
              <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                {t('adminUserDetail.lockedHint')}
              </Text>
            </View>
            <Switch
              value={!user.accountNonLocked}
              onValueChange={handleToggleLocked}
              trackColor={{ false: colors.border, true: colors.error }}
              accessibilityLabel={t('adminUserDetail.accountLocked')}
            />
          </View>
        </Card>

        {/* Verification Token */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('adminUserDetail.verificationToken')}</Text>
        <Card style={styles.cardPadded}>
          {tokenLoading ? (
            <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
          ) : token ? (
            <>
              <View style={styles.tokenInfo}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('adminUserDetail.tokenLabel')}</Text>
                <Text
                  style={[styles.tokenValue, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {token.token}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('adminUserDetail.expiresLabel')}</Text>
                <View style={styles.tokenExpiry}>
                  <Text style={[styles.tokenValue, { color: colors.text }]}>
                    {new Date(token.expiryDate).toLocaleString()}
                  </Text>
                  <Badge
                    label={token.expired ? t('adminUserDetail.expired') : t('adminUserDetail.active')}
                    color={token.expired ? colors.error : colors.success}
                    backgroundColor={token.expired ? colors.errorBackground : colors.successBackground}
                  />
                </View>
              </View>
              <View style={styles.tokenActions}>
                <Button
                  title={t('adminUserDetail.deleteToken')}
                  onPress={handleDeleteToken}
                  variant="outline"
                  style={{ borderColor: colors.error }}
                />
                <Button
                  title={t('adminUserDetail.resendVerification')}
                  onPress={handleRegenerateToken}
                  variant="outline"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.noTokenText, { color: colors.textSecondary }]}>
                {t('adminUserDetail.noToken')}
              </Text>
              <Button
                title={t('adminUserDetail.generateNewToken')}
                onPress={handleRegenerateToken}
                variant="outline"
                style={{ alignSelf: 'stretch' }}
              />
            </>
          )}
        </Card>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.error }]}>{t('adminUserDetail.dangerZone')}</Text>
        <Card style={[styles.cardPadded, { borderColor: colors.error, borderWidth: 1 }]}>
          <Text style={[styles.dangerHint, { color: colors.textSecondary }]}>
            {t('adminUserDetail.dangerDescription')}
          </Text>
          <Button
            title={t('adminUserDetail.deleteUser')}
            onPress={handleDeleteUser}
            variant="danger"
          />
        </Card>
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
  cardPadded: {
    padding: 16,
    marginBottom: 16,
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
  createdAt: {
    fontSize: 13,
    marginTop: 12,
  },
  messageBanner: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveButton: {
    marginTop: 4,
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
    gap: 8,
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
