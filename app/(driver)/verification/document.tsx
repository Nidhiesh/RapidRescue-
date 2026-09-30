import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../../../src/theme';
import { Button, Card, Badge, ScreenWrapper } from '../../../src/components';
import { useVerification } from '../../../src/context';
import { REQUIRED_DOCUMENT_DEFINITIONS } from '../../../src/constants';
import { VerificationDocumentType } from '../../../src/types';

export default function DocumentUploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const docType = (params.type as VerificationDocumentType) || 'DRIVING_LICENSE';

  const { documents, uploadDoc, removeDoc, isLoading, error: verificationError, clearError } = useVerification();
  const currentDoc = documents[docType];
  const definition = REQUIRED_DOCUMENT_DEFINITIONS[docType];

  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Take photo with camera
  const handleLaunchCamera = async () => {
    setLocalError(null);
    clearError?.();
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        setLocalError('Camera permission is required to capture documents.');
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `${docType.toLowerCase()}_camera.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        const size = asset.fileSize;

        const success = await uploadDoc(docType, {
          uri: asset.uri,
          fileName,
          mimeType,
          size,
        });
        if (!success) {
          setLocalError(verificationError || 'Failed to upload document.');
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not open camera. You can try choosing a file instead.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Pick from gallery or documents
  const handlePickDocument = async () => {
    setLocalError(null);
    try {
      setIsProcessing(true);
      // For general documents, support DocumentPicker
      if (docType !== 'DRIVER_SELFIE') {
        const docResult = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });

        if (!docResult.canceled && docResult.assets && docResult.assets.length > 0) {
          const asset = docResult.assets[0];
          const success = await uploadDoc(docType, {
            uri: asset.uri,
            fileName: asset.name,
            mimeType: asset.mimeType || 'application/octet-stream',
            size: asset.size,
          });
          if (!success) {
            setLocalError(verificationError || 'Failed to upload selected file.');
          }
          return;
        }
      }

      // Fallback or ImagePicker library for images/selfie
      const imgResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!imgResult.canceled && imgResult.assets && imgResult.assets.length > 0) {
        const asset = imgResult.assets[0];
        const fileName = asset.fileName || `${docType.toLowerCase()}_gallery.jpg`;
        const success = await uploadDoc(docType, {
          uri: asset.uri,
          fileName,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        });
        if (!success) {
          setLocalError(verificationError || 'Failed to upload selected image.');
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to access file picker. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo simulator quick-attach
  const handleUseDemoSample = async () => {
    setIsProcessing(true);
    setLocalError(null);
    clearError?.();
    try {
      const sampleUris: Record<VerificationDocumentType, string> = {
        DRIVING_LICENSE:
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        GOVERNMENT_ID:
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        DRIVER_SELFIE:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        AMBULANCE_REGISTRATION:
          'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=600&q=80',
        AMBULANCE_PERMIT:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
        VEHICLE_INSURANCE:
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      };

      const success = await uploadDoc(docType, {
        uri: sampleUris[docType],
        fileName: `${docType.toLowerCase()}_verified_sample.jpg`,
        mimeType: 'image/jpeg',
        size: 1024 * 340,
      });
      if (!success) {
        setLocalError(verificationError || 'Failed to attach sample document.');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to attach sample document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async () => {
    await removeDoc(docType);
  };

  const isUploaded = currentDoc?.status === 'UPLOADED';
  const isRejected = currentDoc?.status === 'REJECTED';
  const isPdf = currentDoc?.mimeType === 'application/pdf';

  const activeError = localError || verificationError;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to verification overview"
          >
            <Text style={styles.backText}>← All Documents</Text>
          </Pressable>
          <Badge
            label={definition?.category === 'DRIVER' ? 'Driver File' : 'Ambulance File'}
            variant="info"
          />
        </View>

        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{definition?.name || currentDoc?.name}</Text>
          <Text style={styles.description}>{definition?.description || currentDoc?.description}</Text>
        </View>

        {/* Error Notice */}
        {activeError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{activeError}</Text>
          </View>
        )}

        {/* Rejection Notice if rejected */}
        {isRejected && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>⚠️ Document Needs Correction</Text>
            <Text style={styles.rejectionDesc}>
              {currentDoc?.rejectionReason || 'Please upload a clear, unexpired replacement file.'}
            </Text>
          </View>
        )}

        {/* Main Upload / Preview Area */}
        {isUploaded ? (
          <Card elevated style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Uploaded Document Preview</Text>
              <Badge label="File Attached ✓" variant="success" />
            </View>

            {/* Visual Preview */}
            {isPdf ? (
              <View style={styles.pdfContainer}>
                <Text style={styles.pdfIcon}>📑</Text>
                <Text style={styles.pdfName}>{currentDoc.fileName}</Text>
                <Text style={styles.pdfMeta}>PDF Document • Ready for Review</Text>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentDoc.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Metadata Info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>File Name:</Text>
              <Text style={styles.metaValue}>{currentDoc.fileName}</Text>
            </View>
            {currentDoc.uploadedAt && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Uploaded At:</Text>
                <Text style={styles.metaValue}>
                  {new Date(currentDoc.uploadedAt).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Action Buttons for Uploaded State */}
            <View style={styles.uploadedActions}>
              <Button
                title="Replace Document"
                variant="secondary"
                onPress={handlePickDocument}
                disabled={isLoading || isProcessing}
                loading={isProcessing}
              />
              <Button
                title="Delete File"
                variant="danger"
                onPress={handleRemove}
                disabled={isLoading || isProcessing}
              />
            </View>
          </Card>
        ) : (
          <Card elevated style={styles.uploadAreaCard}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📁</Text>
            </View>
            <Text style={styles.uploadPrompt}>No document attached yet</Text>
            <Text style={styles.uploadFormatNotice}>
              Accepted formats: JPG, PNG, WebP
              {docType !== 'DRIVER_SELFIE' ? ', PDF (Max 10MB)' : ' (Front-facing selfie)'}
            </Text>

            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Uploading document...</Text>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                {definition?.allowCamera && (
                  <Button
                    title="📷  Take Photo with Camera"
                    variant="primary"
                    onPress={handleLaunchCamera}
                    disabled={isLoading || isProcessing}
                  />
                )}
                <Button
                  title="📂  Choose from Files / Gallery"
                  variant="secondary"
                  onPress={handlePickDocument}
                  disabled={isLoading || isProcessing}
                />
                <Button
                  title="⚡  Use Simulated Demo Sample"
                  variant="outline"
                  onPress={handleUseDemoSample}
                  disabled={isLoading || isProcessing}
                />
              </View>
            )}
          </Card>
        )}

        {/* Back Link */}
        <View style={styles.footer}>
          <Button
            title="← Return to Verification Overview"
            variant="secondary"
            onPress={() => router.back()}
          />
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  backButton: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  rejectionCard: {
    backgroundColor: Colors.criticalMuted,
    borderWidth: 1,
    borderColor: Colors.critical,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    gap: 4,
  },
  rejectionTitle: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rejectionDesc: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 18,
  },
  uploadAreaCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginVertical: Spacing.sm,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyIcon: {
    fontSize: 28,
  },
  uploadPrompt: {
    ...Typography.title,
    color: Colors.text,
    marginBottom: 4,
  },
  uploadFormatNotice: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  actionButtons: {
    width: '100%',
    gap: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  previewCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfContainer: {
    width: '100%',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  pdfIcon: {
    fontSize: 48,
  },
  pdfName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  pdfMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  uploadedActions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xl,
  },
});
