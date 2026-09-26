/**
 * RapidRescue Patient Registration Screen
 *
 * Captures patient demographics, blood group, emergency contact details,
 * and registers the profile through the AuthContext / Service layer.
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, borderRadius, spacing } = useTheme();
  const { register, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLocalError(null);
    clearError();

    if (!name.trim() || name.trim().length < 2) {
      setLocalError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setLocalError('Please enter a valid mobile number for emergency dispatch.');
      return;
    }

    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        bloodGroup,
        emergencyContactName: contactName.trim() || undefined,
        emergencyContactRelation: contactRelation.trim() || undefined,
        emergencyContactPhone: contactPhone.trim() || undefined,
      });

      router.replace('/(patient)/home');
    } catch {
      // Error is set in AuthContext
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
          {/* Top Bar with Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back to Login</Text>
          </TouchableOpacity>

          <BrandHeader subtitle="Emergency Profile Registration" />

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
              <Text style={[styles.cardTitle, { color: colors.text }]}>New Patient</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Your details are used by first responders during medical dispatch
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

            {/* Personal Details */}
            <EmergencyInput
              label="Full Name *"
              placeholder="e.g. Jane Doe"
              iconName="person-outline"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (localError) setLocalError(null);
              }}
            />

            <EmergencyInput
              label="Mobile Number *"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              iconName="call-outline"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (localError) setLocalError(null);
              }}
            />

            <EmergencyInput
              label="Email Address (Optional)"
              placeholder="e.g. patient@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail-outline"
              value={email}
              onChangeText={setEmail}
            />

            <EmergencyInput
              label="Account Password (Optional)"
              placeholder="Create a password"
              isPassword
              iconName="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
            />

            {/* Blood Group Selector */}
            <View style={styles.bloodGroupSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Blood Group (Optional)
              </Text>
              <View style={styles.bloodChipsRow}>
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      style={[
                        styles.bloodChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.backgroundElement,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setBloodGroup(bg)}
                    >
                      <Text
                        style={[
                          styles.bloodChipText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Emergency Contact Section */}
            <View style={styles.emergencyContactHeader}>
              <Ionicons name="heart-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
                Emergency Contact (Optional)
              </Text>
            </View>

            <EmergencyInput
              label="Contact Full Name"
              placeholder="e.g. Mark Doe"
              iconName="people-outline"
              value={contactName}
              onChangeText={setContactName}
            />

            <EmergencyInput
              label="Relationship"
              placeholder="e.g. Spouse / Parent / Sibling"
              iconName="git-branch-outline"
              value={contactRelation}
              onChangeText={setContactRelation}
            />

            <EmergencyInput
              label="Contact Mobile Number"
              placeholder="e.g. 9876543211"
              keyboardType="phone-pad"
              iconName="call-outline"
              value={contactPhone}
              onChangeText={setContactPhone}
            />

            {/* Submit Button */}
            <EmergencyButton
              title="Create Profile & Proceed"
              onPress={handleRegister}
              isLoading={isLoading}
              variant="primary"
              icon={<Ionicons name="checkmark-done" size={20} color="#FFFFFF" />}
              style={styles.submitButton}
            />
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
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
  bloodGroupSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  bloodChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  bloodChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emergencyContactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 12,
  },
});
