import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../src/theme';
import { Button, Card, Badge, ScreenWrapper } from '../src/components';
import { APP_CONFIG } from '../src/constants';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Brand Section */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge label="Official Driver Portal" variant="critical" />
            <Text style={styles.versionText}>v{APP_CONFIG.version}</Text>
          </View>

          {/* Emergency Cross / Emblem */}
          <View style={styles.iconContainer}>
            <View style={styles.crossVertical} />
            <View style={styles.crossHorizontal} />
          </View>

          <Text style={styles.appName}>{APP_CONFIG.appName}</Text>
          <Text style={styles.moduleName}>{APP_CONFIG.moduleName}</Text>
          <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
        </View>

        {/* Informational Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Priority Dispatch Network</Text>
          <Text style={styles.description}>{APP_CONFIG.description}</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.featureText}>Real-Time Emergency Alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.statusDot, { backgroundColor: Colors.secondary }]} />
              <Text style={styles.featureText}>Turn-by-Turn Scene Navigation</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.statusDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.featureText}>Verified Responder Network</Text>
            </View>
          </View>
        </Card>

        {/* Action Section */}
        <View style={styles.actionContainer}>
          <Button
            title="Get Started"
            variant="primary"
            onPress={handleGetStarted}
          />
          <Text style={styles.disclaimerText}>
            For verified emergency personnel only. Unauthorized access is prohibited.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  crossVertical: {
    position: 'absolute',
    width: 14,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 42,
    height: 14,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  appName: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
  },
  moduleName: {
    ...Typography.h3,
    color: Colors.primary,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  tagline: {
    ...Typography.subtext,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  infoCard: {
    marginVertical: Spacing.xl,
  },
  infoTitle: {
    ...Typography.title,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  featureList: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    ...Typography.subtext,
    color: Colors.text,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
