import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="live-tracking" />
    </Stack>
  );
}
