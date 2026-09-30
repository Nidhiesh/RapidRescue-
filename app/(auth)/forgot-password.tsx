import React, { useState } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import { Button, Card, Badge, ScreenWrapper, InputField } from '../../src/components';
import { isValidMobile, isNonEmpty } from '../../src/utils';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleResetRequest = async () => {
    if (!isNonEmpty(mobileNumber)) {
      setError('Mobile number is required');
      return;
    }

    if (!isValidMobile(mobileNumber)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Simulate server communication
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Badge label="Account Recovery" variant="warning" />
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back to login"
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Login</Text>
              </Pressable>
            </View>

            <Text style={styles.brandTitle}>RR Driver</Text>
            <Text style={styles.screenTitle}>Password Recovery</Text>
            <Text style={styles.subtitle}>
              Reset instructions will be delivered to your registered mobile number via SMS.
            </Text>
          </View>

          {isSubmitted ? (
            <Card elevated style={styles.card}>
              <View style={styles.successIconCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.submittedTitle}>Reset Link Dispatched</Text>
              <Text style={styles.submittedDesc}>
                In production, a secure one-time OTP / password reset link will be sent to{' '}
                <Text style={styles.mobileHighlight}>{mobileNumber}</Text>.
              </Text>
              <Text style={styles.submittedNote}>
                Note: Backend SMS integration will be implemented in future phases with Ravin's FastAPI services.
              </Text>

              <Button
                title="Return to Login"
                variant="primary"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.returnButton}
              />
            </Card>
          ) : (
            <Card elevated style={styles.card}>
              <InputField
                label="Registered Mobile Number"
                value={mobileNumber}
                onChangeText={(text) => {
                  setMobileNumber(text);
                  if (error) setError(null);
                }}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={15}
                error={error}
                required
                accessibilityLabel="Mobile number for recovery"
              />

              <Button
                title="Send Recovery Instructions"
                variant="primary"
                onPress={handleResetRequest}
                loading={isLoading}
                disabled={isLoading}
                style={styles.submitButton}
              />
            </Card>
          )}

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Back to Driver Login"
              style={styles.backToLoginBtn}
            >
              <Text style={styles.backToLoginText}>Remember your password? Sign in</Text>
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
    justifyContent: 'space-between',
  },
  header: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  brandTitle: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '800',
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
  card: {
    marginVertical: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.successMuted,
    borderWidth: 2,
    borderColor: Colors.success,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  checkmark: {
    fontSize: 28,
    color: Colors.success,
    fontWeight: 'bold',
  },
  submittedTitle: {
    ...Typography.title,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  submittedDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  mobileHighlight: {
    color: Colors.text,
    fontWeight: '600',
  },
  submittedNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  returnButton: {
    marginTop: Spacing.xl,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  backToLoginBtn: {
    paddingVertical: Spacing.sm,
  },
  backToLoginText: {
    ...Typography.subtext,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
