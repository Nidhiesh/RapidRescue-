import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { VerificationDocument } from '../../types';

interface DocumentCardProps {
  document: VerificationDocument;
  onPress: () => void;
  isReadOnly?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPress,
  isReadOnly = false,
}) => {
  const getStatusBadge = () => {
    switch (document.status) {
      case 'UPLOADED':
        return <Badge label="Uploaded ✓" variant="success" />;
      case 'REJECTED':
        return <Badge label="Correction Needed" variant="critical" />;
      case 'UPLOADING':
        return <Badge label="Uploading..." variant="info" />;
      case 'NOT_UPLOADED':
      default:
        return <Badge label="Required" variant="warning" />;
    }
  };

  const getActionLabel = () => {
    if (isReadOnly) return 'View Document';
    if (document.status === 'UPLOADED') return 'Replace / View';
    if (document.status === 'REJECTED') return 'Fix Document';
    return 'Upload File';
  };

  return (
    <Card
      elevated
      style={[
        styles.card,
        document.status === 'REJECTED' && styles.cardRejected,
        document.status === 'UPLOADED' && styles.cardUploaded,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{document.name}</Text>
          <Text style={styles.categoryBadge}>
            {document.category === 'DRIVER' ? 'Driver Credential' : 'Ambulance Document'}
          </Text>
        </View>
        {getStatusBadge()}
      </View>

      <Text style={styles.description}>{document.description}</Text>

      {document.status === 'UPLOADED' && document.fileName && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileIcon}>📄</Text>
          <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
            {document.fileName}
          </Text>
        </View>
      )}

      {document.status === 'REJECTED' && document.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Review Feedback:</Text>
          <Text style={styles.rejectionText}>{document.rejectionReason}</Text>
        </View>
      )}

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionBtn,
          document.status === 'REJECTED' && styles.actionBtnDanger,
          pressed && styles.actionBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${getActionLabel()} for ${document.name}`}
      >
        <Text
          style={[
            styles.actionText,
            document.status === 'REJECTED' && styles.actionTextDanger,
          ]}
        >
          {getActionLabel()} →
        </Text>
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  cardRejected: {
    borderColor: Colors.critical,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  cardUploaded: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 16,
  },
  categoryBadge: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileIcon: {
    fontSize: 14,
  },
  fileName: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    fontFamily: 'monospace',
  },
  rejectionBox: {
    backgroundColor: Colors.criticalMuted,
    borderLeftWidth: 3,
    borderLeftColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    gap: 2,
  },
  rejectionLabel: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  rejectionText: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  actionBtnDanger: {
    justifyContent: 'flex-start',
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionTextDanger: {
    color: Colors.critical,
    fontWeight: '700',
  },
});
