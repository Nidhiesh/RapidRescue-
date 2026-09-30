import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DriverLocation, LocationTrackingStatus } from '../../types';

interface LocationDisplayCardProps {
  trackingStatus: LocationTrackingStatus;
  location: DriverLocation | null;
  error?: string | null;
}

export const LocationDisplayCard: React.FC<LocationDisplayCardProps> = ({
  trackingStatus,
  location,
  error,
}) => {
  const isLive = trackingStatus === 'ACTIVE' && location !== null;

  return (
    <Card elevated style={[styles.card, isLive && styles.cardLive]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>GPS Location Status</Text>
          <Text style={styles.subtitle}>Foreground Dispatch Positioning</Text>
        </View>

        {isLive ? (
          <Badge label="LIVE GPS ✓" variant="success" />
        ) : trackingStatus === 'REQUESTING_PERMISSION' ? (
          <Badge label="CONNECTING..." variant="warning" />
        ) : trackingStatus === 'PERMISSION_DENIED' || trackingStatus === 'SERVICES_DISABLED' || trackingStatus === 'ERROR' ? (
          <Badge label="UNAVAILABLE" variant="critical" />
        ) : (
          <Badge label="SHARING OFF" variant="default" />
        )}
      </View>

      {/* Content based on status */}
      {isLive ? (
        <View style={styles.liveContent}>
          <View style={styles.coordGrid}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LATITUDE</Text>
              <Text style={styles.coordVal}>
                {location.latitude.toFixed(4)}°
              </Text>
            </View>

            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LONGITUDE</Text>
              <Text style={styles.coordVal}>
                {location.longitude.toFixed(4)}°
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Accuracy:</Text>
              <Text style={styles.metaVal}>
                {location.accuracy ? `± ${Math.round(location.accuracy)} m` : 'Standard fix'}
              </Text>
            </View>

            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Last Fix:</Text>
              <Text style={styles.metaVal}>
                {new Date(location.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </View>
      ) : trackingStatus === 'PERMISSION_DENIED' || trackingStatus === 'SERVICES_DISABLED' || trackingStatus === 'ERROR' ? (
        <View style={styles.errorNotice}>
          <Text style={styles.errorTitle}>
            {trackingStatus === 'SERVICES_DISABLED'
              ? 'GPS Hardware Switched Off'
              : trackingStatus === 'PERMISSION_DENIED'
              ? 'Location Permission Denied'
              : 'GPS Signal Unavailable'}
          </Text>
          <Text style={styles.errorDesc}>
            {error || 'Location access is strictly mandatory to enter active ambulance duty.'}
          </Text>
        </View>
      ) : trackingStatus === 'REQUESTING_PERMISSION' ? (
        <View style={styles.connectingBox}>
          <Text style={styles.connectingText}>
            Acquiring satellite telemetry and verifying foreground location permissions...
          </Text>
        </View>
      ) : (
        <View style={styles.offlineBox}>
          <Text style={styles.offlineText}>
            Location sharing is stopped while off duty to preserve battery and privacy.
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  cardLive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  liveContent: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  coordGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  coordBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  coordLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  coordVal: {
    ...Typography.title,
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  metaVal: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 11,
  },
  errorNotice: {
    backgroundColor: Colors.criticalMuted,
    borderLeftWidth: 3,
    borderLeftColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    gap: 2,
  },
  errorTitle: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  errorDesc: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 16,
  },
  connectingBox: {
    backgroundColor: Colors.warningMuted,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  connectingText: {
    ...Typography.caption,
    color: Colors.warning,
    lineHeight: 16,
  },
  offlineBox: {
    paddingVertical: 2,
  },
  offlineText: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
