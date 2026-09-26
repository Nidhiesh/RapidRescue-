/**
 * RapidRescue Patient Emergency Home Screen
 *
 * Requirements:
 * - Single manual action: Tap the SOS button ONCE
 * - No login, registration, or password entry required for emergency assistance
 * - Directly starts the entire automated emergency process
 * - Obvious UI:
 *   Before SOS:
 *   🚨 EMERGENCY
 *   Tap once for immediate ambulance assistance
 * - Duplicate SOS prevention: prevents duplicate requests while one is active
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
import { emergencyService } from '@/services/emergency.service';
import { PulseDot } from '@/components/common/PulseDot';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { colors, borderRadius } = useTheme();
  const { patient, isAuthenticated, logout } = useAuth();
  const [isTriggering, setIsTriggering] = useState(false);

  const handleSosPress = () => {
    if (isTriggering) return;

    // Duplicate SOS prevention
    if (emergencyService.hasActiveEmergency()) {
      router.push('/(emergency)/status');
      return;
    }

    setIsTriggering(true);
    // Navigate straight to automated emergency camera capture screen
    router.push('/(emergency)/camera');
    setTimeout(() => setIsTriggering(false), 1000);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Do you wish to sign out of this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
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
                styles.appIconBadge,
                { backgroundColor: colors.primary, borderRadius: borderRadius.sm },
              ]}
            >
              <Ionicons name="medkit" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.text }]}>RapidRescue</Text>
              <Text style={[styles.systemStatusText, { color: colors.success }]}>
                ● Dispatch Ready
              </Text>
            </View>
          </View>

          {isAuthenticated && (
            <TouchableOpacity
              style={[
                styles.profileChip,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={handleSignOut}
            >
              <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.profileChipText, { color: colors.textSecondary }]}>
                {patient?.name ? patient.name.split(' ')[0] : 'Profile'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Readiness Banner */}
        <View
          style={[
            styles.readinessCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <View style={styles.readinessRow}>
            <PulseDot color={colors.success} size={8} />
            <Text style={[styles.readinessTitle, { color: colors.text }]}>
              Emergency Response Active
            </Text>
          </View>
          <Text style={[styles.readinessSubtitle, { color: colors.textSecondary }]}>
            High-priority emergency ambulance channel is online. Single tap initiates instant dispatch.
          </Text>
        </View>

        {/* Primary SOS Emergency Trigger */}
        <View style={styles.sosContainer}>
          <Text style={[styles.emergencyTitle, { color: colors.primary }]}>
            🚨 EMERGENCY
          </Text>
          <Text style={[styles.emergencySubtitle, { color: colors.textSecondary }]}>
            Tap once for immediate ambulance assistance
          </Text>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleSosPress}
            disabled={isTriggering}
            style={[
              styles.sosButton,
              {
                backgroundColor: '#DC2626',
                shadowColor: '#DC2626',
                opacity: isTriggering ? 0.8 : 1,
              },
            ]}
          >
            <View style={styles.sosInnerRing}>
              <Ionicons name="medical" size={48} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
              <Text style={styles.sosActionText}>TAP ONCE</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.flowExplainer}>
            <View style={styles.flowItem}>
              <Ionicons name="camera-outline" size={16} color={colors.accent} />
              <Text style={[styles.flowText, { color: colors.textMuted }]}>
                Auto Front & Rear Photos
              </Text>
            </View>
            <Text style={[styles.flowDivider, { color: colors.textMuted }]}>•</Text>
            <View style={styles.flowItem}>
              <Ionicons name="navigate-outline" size={16} color={colors.accent} />
              <Text style={[styles.flowText, { color: colors.textMuted }]}>
                Auto GPS Detection
              </Text>
            </View>
            <Text style={[styles.flowDivider, { color: colors.textMuted }]}>•</Text>
            <View style={styles.flowItem}>
              <Ionicons name="flash-outline" size={16} color={colors.accent} />
              <Text style={[styles.flowText, { color: colors.textMuted }]}>
                Instant Dispatch
              </Text>
            </View>
          </View>
        </View>

        {/* Medical Summary if authenticated (Optional, non-blocking) */}
        {patient && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View style={styles.infoCardHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
              <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                Linked Patient Profile
              </Text>
              {patient.bloodGroup && (
                <StatusBadge label={patient.bloodGroup} variant="emergency" />
              )}
            </View>
            <Text style={[styles.patientInfoText, { color: colors.textSecondary }]}>
              {patient.name} • {patient.phone}
            </Text>
          </View>
        )}
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
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appIconBadge: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
  },
  systemStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 6,
  },
  profileChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  readinessCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: 4,
  },
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  readinessTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  readinessSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emergencyTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  emergencySubtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 32,
  },
  sosInnerRing: {
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 4,
  },
  sosActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginTop: 2,
    opacity: 0.9,
  },
  flowExplainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowDivider: {
    fontSize: 12,
  },
  flowText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    padding: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  patientInfoText: {
    fontSize: 13,
  },
});
