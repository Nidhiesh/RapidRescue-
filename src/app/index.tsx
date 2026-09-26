/**
 * RapidRescue Splash & Session Restoration Screen
 *
 * Checks secure hardware keystore on boot:
 * - If valid token & profile found -> routes to Patient Home
 * - If unauthenticated or token expired -> routes to Login
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { BrandHeader } from '@/components/common/BrandHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PulseDot } from '@/components/common/PulseDot';
import { Config } from '@/config/env';

export default function SplashScreen() {
  const router = useRouter();
  const { colors, borderRadius } = useTheme();
  const { status, isAuthenticated } = useAuth();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    // Ensure splash is visible for at least 700ms for smooth visual experience
    const timer = setTimeout(() => {
      setMinSplashElapsed(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minSplashElapsed) return;

    if (status === 'authenticated' && isAuthenticated) {
      router.replace('/(patient)/home');
    } else if (status === 'unauthenticated' || status === 'error') {
      router.replace('/(auth)/login');
    }
  }, [minSplashElapsed, status, isAuthenticated, router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Top Environment Ribbon */}
        <View style={styles.topRibbon}>
          <StatusBadge
            label={Config.env.toUpperCase()}
            variant={Config.isProduction ? 'success' : 'info'}
          />
        </View>

        {/* Brand Display */}
        <View style={styles.brandWrapper}>
          <BrandHeader subtitle="Instant Emergency Medical Dispatch" />
        </View>

        {/* Session Restoration Indicator */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {status === 'restoring_session'
                ? 'Validating secure credentials...'
                : status === 'authenticated'
                ? 'Session verified! Opening portal...'
                : 'Session check complete.'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <PulseDot color={colors.success} size={6} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Secure Storage Protected
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  topRibbon: {
    alignItems: 'flex-end',
  },
  brandWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  statusCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
