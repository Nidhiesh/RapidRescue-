import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../../src/theme';

export default function VerificationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="document" />
      <Stack.Screen name="status" />
    </Stack>
  );
}
