import React from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/theme';
import {
  AuthProvider,
  VerificationProvider,
  AdminProvider,
  LocationProvider,
  EmergencyProvider,
} from '../src/context';

// Disable on-screen LogBox warning notifications
LogBox.ignoreAllLogs(true);

// Intercept and silence benign Expo CLI log forwarder warnings that spam console.warn
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const text = args
      .map((a) => {
        if (typeof a === 'string') return a;
        try {
          return JSON.stringify(a) || '';
        } catch {
          return String(a);
        }
      })
      .join(' ');

    if (
      text.includes('Expo CLI') ||
      text.includes('Cannot connect') ||
      text.includes('cannot connect') ||
      text.includes('Metro') ||
      text.includes('addLog') ||
      text.includes('registerWarning')
    ) {
      return;
    }

    try {
      const stack = new Error().stack || '';
      if (
        stack.includes('registerWarning') ||
        stack.includes('addLog') ||
        (stack.includes('setTimeout$argument_0') &&
          (text.includes('connect') || text.includes('Expo') || text.includes('CLI')))
      ) {
        return;
      }
    } catch {
      // pass
    }

    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const text = args
      .map((a) => (typeof a === 'string' ? a : ''))
      .join(' ');
    if (text.includes('Cannot connect to the Expo CLI') || text.includes('Expo CLI')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AdminProvider>
        <VerificationProvider>
          <LocationProvider>
            <EmergencyProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(driver)" />
                <Stack.Screen name="(admin)" />
              </Stack>
            </EmergencyProvider>
          </LocationProvider>
        </VerificationProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
