import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/theme';
import { Button, Card, Badge, ScreenWrapper, InputField } from '../../src/components';
import { useAuth } from '../../src/context';
import { isValidMobile, isNonEmpty } from '../../src/utils';
import { MOCK_DRIVER_CREDENTIALS } from '../../src/services';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error: authError, clearError, status, session } = useAuth();

  useEffect(() => {
    if (status === 'AUTHENTICATED' && session) {
      if (session.role === 'ADMIN') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(driver)/dashboard');
      }
    }
  }, [status, session, router]);

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');

  // Field validation errors
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;
    clearError();

    // Mobile validation
    if (!isNonEmpty(mobileNumber)) {
      setMobileError('Mobile number is required');
      isValid = false;
    } else if (!isValidMobile(mobileNumber)) {
      setMobileError('Enter a valid 10-digit mobile number');
      isValid = false;
    } else {
      setMobileError(null);
    }

    // Password validation
    if (!isNonEmpty(password)) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login({
      mobileNumber: mobileNumber.trim(),
      password,
    });

    if (result.success && result.session) {
      // Role-based post-authentication routing
      if (result.session.role === 'ADMIN') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(driver)/dashboard');
      }
    }
  };

  const handleFillMockCredentials = () => {
    setMobileNumber(MOCK_DRIVER_CREDENTIALS.mobileNumber);
    setPassword(MOCK_DRIVER_CREDENTIALS.password);
    setMobileError(null);
    setPasswordError(null);
    clearError();
  };

  const handleFillAdminCredentials = () => {
    setMobileNumber('9999999999');
    setPassword('Admin@123');
    setMobileError(null);
    setPasswordError(null);
    clearError();
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Badge label="RapidRescue Emergency Network" variant="critical" />
            </View>

            <Text style={styles.brandTitle}>RapidRescue</Text>
            <Text style={styles.screenTitle}>Emergency Network Login</Text>
            <Text style={styles.subtitle}>
              Sign in with your registered mobile number and password
            </Text>
          </View>

          {/* Error Banner */}
          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          {/* Form Card */}
          <Card elevated style={styles.formCard}>
            <InputField
              label="Mobile Number"
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                if (mobileError) setMobileError(null);
                if (authError) clearError();
              }}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              maxLength={15}
              error={mobileError}
              required
              accessibilityLabel="Mobile Number input"
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
                if (authError) clearError();
              }}
              placeholder="Enter your password"
              isPassword
              error={passwordError}
              required
              accessibilityLabel="Password input"
            />

            {/* Forgot Password Action */}
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPasswordContainer}
              accessibilityRole="button"
              accessibilityLabel="Forgot Password"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            {/* Login Action Button */}
            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              variant="primary"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />
          </Card>

          {/* Dev-Only Mock Credentials Helper Box */}
          <Card style={styles.mockCard}>
            <View style={styles.mockHeader}>
              <Badge label="TEST CREDENTIALS" variant="warning" />
              <Pressable
                onPress={handleFillMockCredentials}
                style={styles.autoFillBtn}
                accessibilityRole="button"
                accessibilityLabel="Quick fill mock credentials"
              >
                <Text style={styles.autoFillBtnText}>Auto-Fill</Text>
              </Pressable>
            </View>
            <Text style={styles.mockDetails}>
              Mobile: {MOCK_DRIVER_CREDENTIALS.mobileNumber}
            </Text>
            <Text style={styles.mockDetails}>
              Password: {MOCK_DRIVER_CREDENTIALS.password}
            </Text>
          </Card>

          {/* Admin Verification Portal Helper Box */}
          <Card style={styles.mockCard}>
            <View style={styles.mockHeader}>
              <Badge label="ADMIN VERIFICATION PORTAL" variant="info" />
              <Pressable
                onPress={handleFillAdminCredentials}
                style={styles.autoFillBtn}
                accessibilityRole="button"
                accessibilityLabel="Quick fill admin credentials"
              >
                <Text style={styles.autoFillBtnText}>Auto-Fill</Text>
              </Pressable>
            </View>
            <Text style={styles.mockDetails}>Mobile: 9999999999</Text>
            <Text style={styles.mockDetails}>Password: Admin@123</Text>
          </Card>

          {/* Registration Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New ambulance driver on the network?</Text>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
              accessibilityLabel="Create Driver Account"
              style={styles.createAccountBtn}
            >
              <Text style={styles.createAccountText}>Create Driver Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  brandTitle: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.subtext,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorBannerText: {
    ...Typography.subtext,
    color: Colors.error,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: Spacing.xs,
  },
  mockCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceHighlight,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  autoFillBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  autoFillBtnText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
  },
  mockDetails: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.base,
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.subtext,
    color: Colors.textSecondary,
  },
  createAccountBtn: {
    paddingVertical: Spacing.xs,
  },
  createAccountText: {
    ...Typography.title,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
