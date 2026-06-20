import React from 'react';
import { View } from '@tarojs/components';
import { CarStatus } from '@/types';
import { getStatusText } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusBadgeProps {
  status: CarStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const cls = classnames(
    styles.badge,
    status === 'recruiting' && styles.recruiting,
    status === 'almost_full' && styles.almostFull,
    status === 'confirmed' && styles.confirmed,
    status === 'playing' && styles.playing,
    status === 'finished' && styles.finished,
    status === 'cancelled' && styles.cancelled,
    className
  );

  return <View className={cls}>{getStatusText(status)}</View>;
};

export default StatusBadge;
