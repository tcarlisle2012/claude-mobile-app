import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AlertBanner, FormInput, Button } from '../components';
import { getErrorMessage, getFieldErrors } from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList>;
};

type FormFields = 'firstName' | 'lastName' | 'username' | 'email' | 'password';
type FormState = Record<FormFields, string>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { register } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fieldRefs = useRef<Record<string, TextInput | null>>({});

  const updateField = (key: FormFields, value: string) => {
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
    if (!form.firstName.trim()) errors.firstName = t('register.validation.firstNameRequired');
    if (!form.lastName.trim()) errors.lastName = t('register.validation.lastNameRequired');
    if (!form.username.trim()) errors.username = t('register.validation.usernameRequired');
    else if (form.username.trim().length < 3) errors.username = t('register.validation.usernameMinLength');
    if (!form.email.trim()) errors.email = t('register.validation.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) errors.email = t('register.validation.emailInvalid');
    if (!form.password) errors.password = t('register.validation.passwordRequired');
    else if (form.password.length < 8) errors.password = t('register.validation.passwordMinLength');

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const message = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      Alert.alert(t('register.successTitle'), message, [
        { text: t('register.signInLink'), onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: unknown) {
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs) {
        setFieldErrors(fieldErrs);
      }
      setError(getErrorMessage(err) || t('register.fallbackError'));
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    key: FormFields;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    autoCapitalize?: 'none' | 'sentences' | 'words';
    keyboardType?: 'default' | 'email-address';
    secure?: boolean;
  }[] = [
    { key: 'firstName', label: t('register.firstNameLabel'), icon: 'person-outline', placeholder: t('register.firstNamePlaceholder'), autoCapitalize: 'words' },
    { key: 'lastName', label: t('register.lastNameLabel'), icon: 'person-outline', placeholder: t('register.lastNamePlaceholder'), autoCapitalize: 'words' },
    { key: 'username', label: t('register.usernameLabel'), icon: 'at-outline', placeholder: t('register.usernamePlaceholder'), autoCapitalize: 'none' },
    { key: 'email', label: t('register.emailLabel'), icon: 'mail-outline', placeholder: t('register.emailPlaceholder'), autoCapitalize: 'none', keyboardType: 'email-address' },
    { key: 'password', label: t('register.passwordLabel'), icon: 'lock-closed-outline', placeholder: t('register.passwordPlaceholder'), secure: true },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person-add-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('register.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('register.subtitle')}
          </Text>
        </View>

        {error ? <AlertBanner type="error" message={error} style={styles.errorBanner} /> : null}

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {fields.map((field) => (
            <FormInput
              key={field.key}
              ref={(el) => { fieldRefs.current[field.key] = el; }}
              label={field.label}
              icon={field.icon}
              value={form[field.key]}
              onChangeText={(v) => updateField(field.key, v)}
              error={fieldErrors[field.key]}
              placeholder={field.placeholder}
              autoCapitalize={field.autoCapitalize}
              keyboardType={field.keyboardType}
              secureTextEntry={field.secure}
              showPasswordToggle={field.secure}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              returnKeyType={field.secure ? 'go' : 'next'}
              onSubmitEditing={() => {
                if (field.secure) {
                  handleRegister();
                } else {
                  const order: FormFields[] = ['firstName', 'lastName', 'username', 'email', 'password'];
                  const next = order[order.indexOf(field.key) + 1];
                  if (next) fieldRefs.current[next]?.focus();
                }
              }}
            />
          ))}
          <Button
            title={t('register.submitButton')}
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('register.hasAccount')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>{t('register.signInLink')}</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
  },
  errorBanner: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
