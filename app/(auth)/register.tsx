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
import { useAuth } from '../../src/context';
import {
  isValidMobile,
  isValidEmail,
  isValidPassword,
  isNonEmpty,
  isValidExperience,
} from '../../src/utils';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error: authError, clearError } = useAuth();

  // Section 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Section 2: Account Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Section 3: Driver Info
  const [driverIdPlaceholder, setDriverIdPlaceholder] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  // Field validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    clearError();

    // Section 1: Personal Details
    if (!isNonEmpty(fullName)) {
      newErrors.fullName = 'Full name is required';
    }

    if (!isNonEmpty(mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!isValidMobile(mobileNumber)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!isNonEmpty(email)) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!isNonEmpty(dateOfBirth)) {
      newErrors.dateOfBirth = 'Date of birth is required (e.g. YYYY-MM-DD)';
    }

    if (!isNonEmpty(address)) {
      newErrors.address = 'Residential / base address is required';
    }

    if (!isNonEmpty(emergencyContact)) {
      newErrors.emergencyContact = 'Emergency contact number is required';
    } else if (!isValidMobile(emergencyContact)) {
      newErrors.emergencyContact = 'Enter a valid 10-digit emergency contact number';
    }

    // Section 2: Security
    if (!isNonEmpty(password)) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Section 3: Driver info
    if (!isNonEmpty(yearsOfExperience)) {
      newErrors.yearsOfExperience = 'Years of experience is required';
    } else if (!isValidExperience(yearsOfExperience)) {
      newErrors.yearsOfExperience = 'Enter a valid number of years (0 - 50)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const result = await register({
      fullName,
      mobileNumber,
      email,
      dateOfBirth,
      address,
      emergencyContact,
      password,
      confirmPassword,
      driverIdPlaceholder,
      yearsOfExperience,
    });

    if (result.success) {
      router.replace({
        pathname: '/(auth)/register-success',
        params: {
          driverName: fullName,
          driverId: result.session?.driverId || 'RR-DRV-NEW',
        },
      });
    }
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
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
              <Badge label="New Driver Application" variant="critical" />
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back to login"
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </Pressable>
            </View>

            <Text style={styles.brandTitle}>RR Driver</Text>
            <Text style={styles.screenTitle}>Driver Registration</Text>
            <Text style={styles.subtitle}>
              Register your profile to join the RapidRescue emergency ambulance network.
            </Text>
          </View>

          {/* Error Banner */}
          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          {/* Section 1: Personal Details */}
          <Card elevated style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Personal Details</Text>
            </View>

            <InputField
              label="Full Legal Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                clearFieldError('fullName');
              }}
              placeholder="e.g. Gokul Nathan"
              autoCapitalize="words"
              error={errors.fullName}
              required
            />

            <InputField
              label="Mobile Number"
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                clearFieldError('mobileNumber');
              }}
              placeholder="10-digit primary mobile"
              keyboardType="phone-pad"
              maxLength={15}
              error={errors.mobileNumber}
              required
            />

            <InputField
              label="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError('email');
              }}
              placeholder="name@emergency.org"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
            />

            <InputField
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={(text) => {
                setDateOfBirth(text);
                clearFieldError('dateOfBirth');
              }}
              placeholder="YYYY-MM-DD"
              error={errors.dateOfBirth}
              required
            />

            <InputField
              label="Residential Address"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                clearFieldError('address');
              }}
              placeholder="Enter current city, street address"
              multiline
              numberOfLines={2}
              error={errors.address}
              required
            />

            <InputField
              label="Emergency Contact Number"
              value={emergencyContact}
              onChangeText={(text) => {
                setEmergencyContact(text);
                clearFieldError('emergencyContact');
              }}
              placeholder="Next-of-kin mobile number"
              keyboardType="phone-pad"
              maxLength={15}
              error={errors.emergencyContact}
              required
            />
          </Card>

          {/* Section 2: Account Security */}
          <Card elevated style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Account Security</Text>
            </View>

            <InputField
              label="Create Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError('password');
              }}
              placeholder="Minimum 6 characters"
              isPassword
              error={errors.password}
              required
            />

            <InputField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError('confirmPassword');
              }}
              placeholder="Re-enter your password"
              isPassword
              error={errors.confirmPassword}
              required
            />
          </Card>

          {/* Section 3: Driver Information */}
          <Card elevated style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>Basic Driver Information</Text>
            </View>

            <InputField
              label="Driver Badge / Employee ID (Optional)"
              value={driverIdPlaceholder}
              onChangeText={setDriverIdPlaceholder}
              placeholder="e.g. RR-DRV-7842 (leave empty to auto-generate)"
              autoCapitalize="characters"
            />

            <InputField
              label="Years of Driving Experience"
              value={yearsOfExperience}
              onChangeText={(text) => {
                setYearsOfExperience(text);
                clearFieldError('yearsOfExperience');
              }}
              placeholder="e.g. 5"
              keyboardType="numeric"
              maxLength={2}
              error={errors.yearsOfExperience}
              required
            />
          </Card>

          {/* Phase 3 Notice Card */}
          <Card style={styles.phaseNoticeCard}>
            <Badge label="Phase 3 Preview" variant="warning" />
            <Text style={styles.phaseNoticeTitle}>Document Verification Notice</Text>
            <Text style={styles.phaseNoticeText}>
              Government driving licenses, commercial permits, and ambulance vehicle registration
              will be uploaded and submitted during Phase 3.
            </Text>
          </Card>

          {/* Submit Action */}
          <View style={styles.actionContainer}>
            <Button
              title="Submit Driver Registration"
              variant="primary"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              disabled={isLoading}
            />
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
    paddingBottom: Spacing.xxxl,
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
  errorBanner: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorBannerText: {
    ...Typography.subtext,
    color: Colors.error,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '800',
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  phaseNoticeCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.warningMuted,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  phaseNoticeTitle: {
    ...Typography.title,
    color: Colors.warning,
    fontSize: 15,
    marginTop: Spacing.xs,
  },
  phaseNoticeText: {
    ...Typography.subtext,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionContainer: {
    gap: Spacing.md,
  },
});
