import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Badge } from '../common/Badge';
import { VerificationStatus } from '../../types';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isDashboard?: boolean;
}

export const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  status,
  style,
  textStyle,
  isDashboard = false,
}) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge
          label="VERIFIED ✓"
          variant="success"
          style={style}
          textStyle={textStyle}
        />
      );
    case 'UNDER_REVIEW':
      return (
        <Badge
          label="UNDER REVIEW"
          variant="info"
          style={style}
          textStyle={textStyle}
        />
      );
    case 'PENDING':
      return (
        <Badge
          label="PENDING"
          variant="warning"
          style={style}
          textStyle={textStyle}
        />
      );
    case 'REJECTED':
      return (
        <Badge
          label="REJECTED"
          variant="critical"
          style={style}
          textStyle={textStyle}
        />
      );
    case 'NOT_SUBMITTED':
    default:
      return (
        <Badge
          label="NOT SUBMITTED"
          variant="default"
          style={style}
          textStyle={textStyle}
        />
      );
  }
};
