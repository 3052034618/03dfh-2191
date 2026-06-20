import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  desc?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title = '暂无数据',
  desc = '这里空空如也，稍后再来看看吧'
}) => {
  return (
    <View className={styles.emptyWrap}>
      <View className={styles.icon}>{icon}</View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.desc}>{desc}</Text>
    </View>
  );
};

export default EmptyState;
