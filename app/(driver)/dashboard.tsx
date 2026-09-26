import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/theme';
import { Card, Badge, ScreenWrapper, Button } from '../../src/components';
import { useAuth } from '../../src/context';

export default function DashboardPlaceholderScreen() {
  const router = useRouter();
  const { session, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Badge label="Phase 4: Dashboard Shell" variant="info" />
          <Text style={styles.title}>RR Driver Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome, {session?.name || 'Emergency Responder'}
          </Text>
        </View>

        {session && (
          <Card elevated style={styles.sessionCard}>
            <Text style={styles.cardTitle}>Active Driver Session</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Driver ID:</Text>
              <Text style={styles.valueHighlight}>{session.driverId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mobile:</Text>
              <Text style={styles.value}>{session.mobileNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Experience:</Text>
              <Text style={styles.value}>{session.yearsOfExperience ?? 0} Years</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mode:</Text>
              <Badge label="DEVELOPMENT MOCK" variant="warning" />
            </View>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Implementation</Text>
          <Text style={styles.description}>
            Online/Offline toggling, GPS location broadcasting, and real-time emergency dispatch alerts
            will be mounted here in Phase 4 & 5.
          </Text>
        </Card>

        <View style={styles.footer}>
          <Button
            title="Sign Out (Clear Session)"
            variant="secondary"
            onPress={handleSignOut}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  sessionCard: {
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    marginVertical: Spacing.sm,
  },
  cardTitle: {
    ...Typography.title,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    ...Typography.subtext,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  valueHighlight: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  footer: {
    marginBottom: Spacing.base,
  },
});
