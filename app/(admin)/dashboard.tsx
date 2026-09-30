import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import {
  Card,
  Badge,
  ScreenWrapper,
  Button,
  DriverVerificationCard,
} from '../../src/components';
import { useAdmin, useAuth } from '../../src/context';
import { verificationService } from '../../src/services';
import { VerificationSummaryStats, DriverVerificationSummary } from '../../src/types';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { session: authSession, status: authStatus, logout: authLogout } = useAuth();
  const { isAuthenticated, adminName, adminId, logout: adminLogout } = useAdmin();

  const isActuallyAdmin = isAuthenticated || authSession?.role === 'ADMIN';

  const [stats, setStats] = useState<VerificationSummaryStats>({
    pendingCount: 0,
    underReviewCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
    totalDriversCount: 0,
  });

  const [pendingDrivers, setPendingDrivers] = useState<DriverVerificationSummary[]>([]);
  const [allDrivers, setAllDrivers] = useState<DriverVerificationSummary[]>([]);
  const [viewFilter, setViewFilter] = useState<'PENDING_ONLY' | 'ALL'>('PENDING_ONLY');
  const [searchDriverId, setSearchDriverId] = useState<string>('');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Access guard
  useEffect(() => {
    if (authStatus === 'INITIALIZING') {
      return;
    }
    if (!isActuallyAdmin) {
      router.replace('/(auth)/login');
    }
  }, [authStatus, isActuallyAdmin, router]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [fetchedStats, pendingList, fullList] = await Promise.all([
        verificationService.getVerificationSummaryStats(),
        verificationService.getPendingDrivers(),
        verificationService.getAllDrivers(),
      ]);

      setStats(fetchedStats);
      setPendingDrivers(pendingList);
      setAllDrivers(fullList);
    } catch (err) {
      // handled locally
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isActuallyAdmin) {
      loadDashboardData();
    }
  }, [isActuallyAdmin, loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleReviewDriver = (driverId: string) => {
    router.push({
      pathname: '/(admin)/driver-review',
      params: { driverId },
    });
  };

  const handleSignOut = async () => {
    await adminLogout();
    await authLogout();
    router.replace('/(auth)/login');
  };

  const displayedList = viewFilter === 'PENDING_ONLY' ? pendingDrivers : allDrivers;

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Navigation & Admin Bar */}
        <View style={styles.topBar}>
          <View style={styles.adminInfo}>
            <Badge label="ADMINISTRATOR" variant="critical" />
            <Text style={styles.adminIdText}>{adminId || 'RR-ADM-001'}</Text>
          </View>
          <Pressable
            onPress={handleSignOut}
            style={styles.signOutBtn}
            accessibilityRole="button"
            accessibilityLabel="Admin Sign Out"
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Dashboard Title */}
        <View style={styles.titleSection}>
          <Text style={styles.dashboardTitle}>Admin Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>
            RapidRescue Driver Verification & Dispatch Authorization
          </Text>
          <Text style={styles.adminGreeting}>
            Logged in as <Text style={styles.adminNameHighlight}>{adminName}</Text>
          </Text>
        </View>

        {/* Summary Metric Cards Grid */}
        <View style={styles.statsGrid}>
          <Card elevated style={[styles.statCard, styles.pendingBorder]}>
            <Text style={[styles.statNumber, { color: Colors.warning }]}>
              {stats.pendingCount}
            </Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </Card>

          <Card elevated style={[styles.statCard, styles.reviewBorder]}>
            <Text style={[styles.statNumber, { color: Colors.secondary }]}>
              {stats.underReviewCount}
            </Text>
            <Text style={styles.statLabel}>Under Review</Text>
          </Card>

          <Card elevated style={[styles.statCard, styles.verifiedBorder]}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>
              {stats.verifiedCount}
            </Text>
            <Text style={styles.statLabel}>Verified Drivers</Text>
          </Card>

          <Card elevated style={[styles.statCard, styles.rejectedBorder]}>
            <Text style={[styles.statNumber, { color: Colors.critical }]}>
              {stats.rejectedCount}
            </Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </Card>
        </View>

        {/* Direct Driver Lookup & Operational Authorization */}
        <Card elevated style={styles.directApprovalCard}>
          <View style={styles.directApprovalHeader}>
            <Text style={styles.directApprovalTitle}>Authorize Driver Eligibility</Text>
            <Badge label="INSTANT APPROVAL" variant="success" />
          </View>
          <Text style={styles.directApprovalSubtitle}>
            Enter any registered Driver ID to directly inspect credentials and grant operational dispatch eligibility.
          </Text>
          <View style={styles.directApprovalInputRow}>
            <TextInput
              style={styles.directApprovalInput}
              placeholder="e.g. RR-DRV-4A6775"
              placeholderTextColor={Colors.textMuted}
              value={searchDriverId}
              onChangeText={setSearchDriverId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Button
              title="Review & Authorize →"
              variant="primary"
              disabled={!searchDriverId.trim()}
              onPress={() => {
                if (searchDriverId.trim()) {
                  handleReviewDriver(searchDriverId.trim().toUpperCase());
                }
              }}
              style={styles.directApprovalBtn}
            />
          </View>
        </Card>

        {/* Queue Filter Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>
              {viewFilter === 'PENDING_ONLY' ? 'Pending Verifications' : 'All Registered Drivers'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {displayedList.length} applicant{displayedList.length === 1 ? '' : 's'} in view
            </Text>
          </View>

          <View style={styles.filterToggle}>
            <Pressable
              onPress={() => setViewFilter('PENDING_ONLY')}
              style={[
                styles.toggleBtn,
                viewFilter === 'PENDING_ONLY' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  viewFilter === 'PENDING_ONLY' && styles.toggleBtnTextActive,
                ]}
              >
                Action Needed
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewFilter('ALL')}
              style={[styles.toggleBtn, viewFilter === 'ALL' && styles.toggleBtnActive]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  viewFilter === 'ALL' && styles.toggleBtnTextActive,
                ]}
              >
                All ({stats.totalDriversCount})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Driver List */}
        {loadingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching verification queue...</Text>
          </View>
        ) : displayedList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>Queue Clear</Text>
            <Text style={styles.emptySubtitle}>
              No driver applications are currently waiting for admin action.
            </Text>
          </Card>
        ) : (
          displayedList.map((driver) => (
            <DriverVerificationCard
              key={driver.driverId}
              driver={driver}
              onReview={handleReviewDriver}
            />
          ))
        )}

        {/* Driver App Switch Link for Testing */}
        <View style={styles.footer}>
          <Card style={styles.switchPortalCard}>
            <Text style={styles.switchPortalTitle}>Tester Portal Switcher</Text>
            <Text style={styles.switchPortalDesc}>
              Jump to the Driver Mobile interface to test document submission from a driver's perspective.
            </Text>
            <Button
              title="Open Driver Portal →"
              variant="secondary"
              onPress={() => router.replace('/(driver)/dashboard')}
              style={styles.switchPortalBtn}
            />
          </Card>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adminIdText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  signOutBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signOutText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  dashboardTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  dashboardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminGreeting: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  adminNameHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  reviewBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  verifiedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  rejectedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 18,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  footer: {
    marginTop: Spacing.xl,
  },
  switchPortalCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    gap: 4,
  },
  switchPortalTitle: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  switchPortalDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  switchPortalBtn: {
    marginTop: Spacing.sm,
  },
  directApprovalCard: {
    marginBottom: Spacing.xl,
    borderColor: Colors.border,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  directApprovalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  directApprovalTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text,
  },
  directApprovalSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  directApprovalInputRow: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  directApprovalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    ...Typography.body,
    fontFamily: 'monospace',
  },
  directApprovalBtn: {
    marginTop: 2,
  },
});
