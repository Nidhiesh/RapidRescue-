/**
 * RapidRescue Emergency Stack Layout
 *
 * Groups the camera and confirmation screens under the (emergency) route group.
 * No header is shown — each screen provides its own navigation controls.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function EmergencyLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="status" options={{ headerShown: false }} />
      <Stack.Screen name="camera" options={{ headerShown: false }} />
      <Stack.Screen name="confirm" options={{ headerShown: false }} />
    </Stack>
  );
}
