/**
 * RapidRescue Patient Login Screen
 *
 * Captures patient credentials, validates inputs, and triggers
 * authentication through the AuthContext / Service layer.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { BrandHeader } from '@/components/common/BrandHeader';
import { EmergencyInput } from '@/components/common/EmergencyInput';
import { EmergencyButton } from '@/components/common/EmergencyButton';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, borderRadius, spacing } = useTheme();
  const { login, isLoading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('9876543210');
  const [password, setPassword] = useState('pass123');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!identifier.trim()) {
      setLocalError('Please enter your mobile number or email.');
      return;
    }

    try {
      await login({
        identifier: identifier.trim(),
        password: password.trim() || undefined,
      });
      // AuthProvider will update status to 'authenticated', router replaces to home
      router.replace('/(patient)/home');
    } catch {
      // Error handled and set in AuthContext
    }
  };

  const handleDemoFill = (type: 'valid' | 'invalid' | 'offline') => {
    setLocalError(null);
    clearError();
    if (type === 'valid') {
      setIdentifier('9876543210');
      setPassword('secure123');
    } else if (type === 'invalid') {
      setIdentifier('9999999999');
      setPassword('wrong');
    } else if (type === 'offline') {
      setIdentifier('0000000000');
      setPassword('pass');
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <BrandHeader subtitle="Emergency Patient Portal" />

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Patient Sign In</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Sign in to request emergency ambulance dispatch
              </Text>
            </View>

            {/* Error Notification Banner */}
            {displayError && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={20} color={colors.primary} />
                <Text style={[styles.errorBannerText, { color: colors.primary }]}>
                  {displayError}
                </Text>
              </View>
            )}

            {/* Inputs */}
            <EmergencyInput
              label="Mobile Number / Email"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              autoCapitalize="none"
              iconName="call-outline"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (localError) setLocalError(null);
                if (error) clearError();
              }}
            />

            <EmergencyInput
              label="Password (if set)"
              placeholder="Enter password"
              isPassword
              iconName="lock-closed-outline"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (localError) setLocalError(null);
                if (error) clearError();
              }}
            />

            {/* Submit Button */}
            <EmergencyButton
              title="Sign In to RapidRescue"
              onPress={handleLogin}
              isLoading={isLoading}
              variant="primary"
              icon={<Ionicons name="log-in-outline" size={20} color="#FFFFFF" />}
              style={styles.submitButton}
            />

            {/* Navigation to Register */}
            <View style={styles.registerPrompt}>
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                First time patient?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={[styles.registerLink, { color: colors.accent }]}>
                  Register Patient Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Integration Testing Helpers */}
          <View style={styles.testingSection}>
            <Text style={[styles.testingTitle, { color: colors.textMuted }]}>
              TEST PRESETS (PHASE 2 VALIDATION)
            </Text>
            <View style={styles.testButtonsRow}>
              <TouchableOpacity
                style={[styles.testChip, { backgroundColor: colors.backgroundElement }]}
                onPress={() => handleDemoFill('valid')}
              >
                <Text style={[styles.testChipText, { color: colors.text }]}>✓ Valid Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testChip, { backgroundColor: colors.backgroundElement }]}
                onPress={() => handleDemoFill('invalid')}
              >
                <Text style={[styles.testChipText, { color: colors.amber }]}>! Invalid 401</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testChip, { backgroundColor: colors.backgroundElement }]}
                onPress={() => handleDemoFill('offline')}
              >
                <Text style={[styles.testChipText, { color: colors.primary }]}>✕ Server 503</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  promptText: {
    fontSize: 13,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  testingSection: {
    marginTop: 24,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  testingTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
