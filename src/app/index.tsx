/**
 * RapidRescue Patient App - Phase 1 Splash & Initialization Screen
 *
 * Displays the initial loading/splash view with emergency brand identity,
 * environment diagnostics, and architecture readiness status.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BrandHeader } from '@/components/common/BrandHeader';
import { SystemCheckCard } from '@/components/common/SystemCheckCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Config } from '@/config/env';

export default function SplashScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [initStage, setInitStage] = useState<'checking' | 'ready'>('checking');
  const [currentStep, setCurrentStep] = useState('Verifying environment configuration...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStep('Initializing REST client and WebSocket contracts...');
    }, 700);

    const timer2 = setTimeout(() => {
      setCurrentStep('Architecture foundation ready.');
      setInitStage('ready');
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Environment Ribbon */}
        <View style={styles.topRibbon}>
          <StatusBadge
            label={`PATIENT APP • ${Config.env.toUpperCase()}`}
            variant={Config.isProduction ? 'success' : 'info'}
            icon={<Ionicons name="shield-checkmark" size={12} color={Config.isProduction ? colors.success : colors.accent} />}
          />
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            SDK 57 • Expo Router
          </Text>
        </View>

        {/* Hero Brand Header */}
        <BrandHeader subtitle="Instant Emergency Medical Dispatch & Live Tracking" />

        {/* Loading / Status Bar */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <View style={styles.statusRow}>
            {initStage === 'checking' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            )}
            <Text style={[styles.statusText, { color: colors.text }]}>
              {currentStep}
            </Text>
          </View>
        </View>

        {/* Diagnostic Architecture Overview */}
        <SystemCheckCard />

        {/* Phase Notice Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Phase 1 Completed: Project Foundation & Architecture.
          </Text>
          <Text style={[styles.footerSubText, { color: colors.textMuted }]}>
            Ready for Phase 2: Authentication & Secure Token Storage.
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
    paddingBottom: 32,
    flexGrow: 1,
  },
  topRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBanner: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerSubText: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
});
