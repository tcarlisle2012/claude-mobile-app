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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<{ Login: undefined; Register: undefined }>;
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

        {error ? (
          <View
            style={[styles.errorBox, { backgroundColor: colors.errorBackground }]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {fields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: fieldErrors[field.key] ? colors.error : colors.border },
                ]}
              >
                <Ionicons name={field.icon} size={18} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  ref={(el) => { fieldRefs.current[field.key] = el; }}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  value={form[field.key]}
                  onChangeText={(v) => updateField(field.key, v)}
                  autoCapitalize={field.autoCapitalize ?? 'sentences'}
                  keyboardType={field.keyboardType ?? 'default'}
                  secureTextEntry={field.secure && !showPassword}
                  autoCorrect={false}
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
                {field.secure && (
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('register.hidePassword') : t('register.showPassword')}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                )}
              </View>
              {fieldErrors[field.key] ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>{fieldErrors[field.key]}</Text>
              ) : null}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            accessibilityLabel={t('register.submitButton')}
          >
            {loading ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>{t('register.submitButton')}</Text>
            )}
          </TouchableOpacity>
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
  eyeButton: {
    padding: 8,
    marginRight: -4,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
