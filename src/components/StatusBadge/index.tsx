import React from 'react';
import { View } from '@tarojs/components';
import { CarStatus } from '@/types';
import { getStatusText } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusBadgeProps {
  status: CarStatus;
  className?: string;
  finalConfirmed?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, finalConfirmed }) => {
  const isLocked = finalConfirmed && status === 'confirmed';
  const cls = classnames(
    styles.badge,
    isLocked && styles.locked,
    !isLocked && status === 'recruiting' && styles.recruiting,
    !isLocked && status === 'almost_full' && styles.almostFull,
    !isLocked && status === 'confirmed' && styles.confirmed,
    !isLocked && status === 'playing' && styles.playing,
    !isLocked && status === 'finished' && styles.finished,
    !isLocked && status === 'cancelled' && styles.cancelled,
    className
  );

  return <View className={cls}>{getStatusText(status, finalConfirmed)}</View>;
};

export default StatusBadge;
