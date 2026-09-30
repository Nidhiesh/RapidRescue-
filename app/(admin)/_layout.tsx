import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="driver-review" />
    </Stack>
  );
}
