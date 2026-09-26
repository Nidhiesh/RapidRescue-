/**
 * RapidRescue Patient Emergency Home Screen (Phase 4)
 *
 * Requirements:
 * - Extremely simple layout
 * - Main element: 🚨 SOS
 * - Before SOS: "Press SOS for emergency ambulance"
 * - After SOS: "Emergency request in progress..."
 * - Prevent multiple SOS requests while the current emergency is active
 * - Zero login / registration requirements
 */

import React, { useState, useEffect } from 'react';
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
import { locationService } from '@/services/location.service';
import { PulseDot } from '@/components/common/PulseDot';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // Sync active emergency state
  useEffect(() => {
    setIsEmergencyActive(emergencyService.hasActiveEmergency());
  }, []);

  const handleSosPress = () => {
    // 6. Duplicate SOS prevention: ignore additional presses while active
    if (emergencyService.hasActiveEmergency() || isEmergencyActive) {
      router.push('/(emergency)/status');
      return;
    }

    setIsEmergencyActive(true);

    // 3. Initiate GPS location capture immediately in parallel with camera opening
    locationService.captureCurrentLocation().then((outcome) => {
      if (outcome.success) {
        emergencyService.setCachedLocation(outcome.location, outcome.address);
      }
    }).catch(() => {
      // Best-effort parallel capture; status screen handles location fallback safely
    });

    // 2. Open automated camera flow (Front -> Rear)
    router.push('/(emergency)/camera');
  };

  const handleSignOut = () => {
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
        {/* Minimal Top Header */}
        <View style={styles.topBar}>
          <View style={styles.brandingRow}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="medkit" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>RapidRescue</Text>
          </View>

          {isAuthenticated && (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Primary SOS Action Container */}
        <View style={styles.centerContainer}>
          <View style={styles.statusIndicator}>
            <PulseDot color={isEmergencyActive ? colors.primary : colors.success} size={8} />
            <Text style={[styles.statusText, { color: isEmergencyActive ? colors.primary : colors.success }]}>
              {isEmergencyActive ? 'Emergency Active' : 'Emergency System Ready'}
            </Text>
          </View>

          {/* Primary SOS Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSosPress}
            style={[
              styles.sosCircle,
              {
                backgroundColor: '#DC2626',
                shadowColor: '#DC2626',
                opacity: isEmergencyActive ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.sosInnerBorder}>
              <Ionicons name="medical" size={54} color="#FFFFFF" />
              <Text style={styles.sosText}>SOS</Text>
              {isEmergencyActive && (
                <Text style={styles.sosActiveSubtext}>ACTIVE</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Before SOS vs After SOS Status Messages */}
          <Text style={[styles.instructionText, { color: isEmergencyActive ? colors.primary : colors.text }]}>
            {isEmergencyActive
              ? 'Emergency request in progress...'
              : 'Press SOS for emergency ambulance'}
          </Text>

          <Text style={[styles.subInstructionText, { color: colors.textSecondary }]}>
            {isEmergencyActive
              ? 'Photos and GPS location are being processed.'
              : 'Tap once. Emergency photos and location are gathered automatically.'}
          </Text>
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signOutBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sosCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
    marginBottom: 36,
  },
  sosInnerBorder: {
    width: 204,
    height: 204,
    borderRadius: 102,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.45)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 4,
  },
  sosActiveSubtext: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 280,
  },
  subInstructionText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 18,
  },
});
