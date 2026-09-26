/**
 * RapidRescue Patient Home Screen
 *
 * Authenticated patient dashboard displaying:
 * - Patient emergency profile & blood group
 * - Emergency Contact card
 * - Primary Emergency SOS button (Entry point for Phase 3)
 * - Secure session management & Logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { PulseDot } from '@/components/common/PulseDot';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { colors, borderRadius, spacing } = useTheme();
  const { patient, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of RapidRescue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace('/(auth)/login');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleEmergencyTrigger = () => {
    Alert.alert(
      'Phase 3 Upcoming',
      'Phase 2 Authentication is verified! Emergency SOS button will trigger the Front Camera Photo & GPS Location capture in Phase 3.'
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.primary, borderRadius: borderRadius.full },
              ]}
            >
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>
                Welcome back,
              </Text>
              <Text style={[styles.patientName, { color: colors.text }]}>
                {patient?.name || 'Patient'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.primary} />
            <Text style={[styles.logoutText, { color: colors.primary }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Readiness Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <PulseDot color={colors.success} size={8} />
              <Text style={[styles.statusTitle, { color: colors.text, marginLeft: 8 }]}>
                Secure Session Active
              </Text>
            </View>
            <StatusBadge label="AUTHENTICATED" variant="success" />
          </View>
          <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
            Protected via hardware-backed token storage (expo-secure-store).
          </Text>
        </View>

        {/* Central SOS Emergency Trigger (Sets stage for Phase 3) */}
        <View style={styles.emergencyContainer}>
          <Text style={[styles.emergencyHeading, { color: colors.text }]}>
            Emergency Assistance
          </Text>
          <Text style={[styles.emergencySubheading, { color: colors.textSecondary }]}>
            Press the button below to dispatch immediate medical response
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleEmergencyTrigger}
            style={[
              styles.sosCircle,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Ionicons name="medical" size={44} color="#FFFFFF" />
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubtext}>REQUEST AMBULANCE</Text>
          </TouchableOpacity>
        </View>

        {/* Medical & Emergency Contact Summary Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.profileCardHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            <Text style={[styles.profileCardTitle, { color: colors.text }]}>
              Registered Medical Profile
            </Text>
          </View>

          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>MOBILE NUMBER</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>
                {patient?.phone || 'Not recorded'}
              </Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>BLOOD GROUP</Text>
              <Text style={[styles.profileValue, { color: colors.primary }]}>
                {patient?.bloodGroup || 'Not specified'}
              </Text>
            </View>
          </View>

          {patient?.emergencyContact && (
            <View
              style={[
                styles.emergencyContactCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <View style={styles.contactHeader}>
                <Ionicons name="call-outline" size={16} color={colors.success} />
                <Text style={[styles.contactHeading, { color: colors.text }]}>
                  Emergency Contact
                </Text>
              </View>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {patient.emergencyContact.name}{' '}
                <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>
                  ({patient.emergencyContact.relationship})
                </Text>
              </Text>
              <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                {patient.emergencyContact.phone}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusCard: {
    padding: 14,
    borderWidth: 1,
    marginVertical: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 12,
  },
  emergencyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emergencyHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emergencySubheading: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  sosCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  sosText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 4,
  },
  sosSubtext: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 2,
    opacity: 0.9,
  },
  profileCard: {
    padding: 18,
    borderWidth: 1,
    marginTop: 8,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  profileCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  profileItem: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  emergencyContactCard: {
    padding: 12,
    marginTop: 4,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contactHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactPhone: {
    fontSize: 13,
    marginTop: 2,
  },
});
