import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right', 'bottom'],
}) => {
  return (
    <SafeAreaView edges={edges} style={styles.container}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
  },
});
