/**
 * RapidRescue Deprecated Manual Confirmation Screen
 *
 * Superseded by the single-tap automated flow: /(emergency)/status
 * No manual confirmation or manual "DISPATCH AMBULANCE" button is permitted.
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function DeprecatedConfirmScreen() {
  return <Redirect href="/(emergency)/status" />;
}
