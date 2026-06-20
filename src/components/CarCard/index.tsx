import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Car } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import PlayerAvatar from '@/components/PlayerAvatar';
import { formatDate, getConfirmedCount, getRemainingCount, getGenderTip, getDepositCount } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

interface CarCardProps {
  car: Car;
  showActions?: boolean;
  onClick?: () => void;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryText?: string;
  secondaryText?: string;
  onViewList?: () => void;
  onCopyInfo?: () => void;
  onSendNotice?: () => void;
  onManageDeposit?: () => void;
}

const CarCard: React.FC<CarCardProps> = ({
  car,
  showActions = true,
  onClick,
  onPrimary,
  onSecondary,
  primaryText,
  secondaryText,
  onViewList,
  onCopyInfo,
  onSendNotice,
  onManageDeposit
}) => {
  const confirmed = getConfirmedCount(car);
  const remaining = getRemainingCount(car);
  const progress = Math.min(100, (confirmed / car.minPlayers) * 100);
  const genderTip = getGenderTip(car.genderRequirement, car.players);
  const { paid, total } = getDepositCount(car);
  const isLocked = car.finalConfirmed && car.status === 'confirmed';
  const showQuickActions = isLocked && car.status !== 'finished' && car.status !== 'cancelled' && (onViewList || onCopyInfo || onSendNotice || onManageDeposit);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/car-detail/index?id=${car.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.coverWrap}>
          <Image className={styles.cover} src={car.scriptCover} mode="aspectFill" />
        </View>
        <View className={styles.info}>
          <View>
            <View className={styles.topRow}>
              <Text className={styles.name}>{car.scriptName}</Text>
              <StatusBadge status={car.status} finalConfirmed={car.finalConfirmed} />
            </View>
            <View className={styles.metaRow}>
              <View className={styles.metaItem}>
                <Text className={styles.time}>{formatDate(car.date)} {car.startTime}</Text>
              </View>
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>房间:</Text>
                <Text>{car.roomName}</Text>
              </View>
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>DM:</Text>
                <Text>{car.dmName}</Text>
              </View>
              <View className={styles.metaItem}>
                <Text className={styles.price}>¥{car.price}/人</Text>
              </View>
            </View>
          </View>
          <View className={styles.metaRow}>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>车头:</Text>
              <Text style={{ color: '#FF7D54' }}>{car.captainName}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.progress}>
        <View className={styles.progressBarWrap}>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
          <View className={styles.progressText}>
            <Text className={styles.highlight}>{confirmed}</Text>
            <Text>/{car.minPlayers}人成车</Text>
            {isLocked && (
              <Text style={{ marginLeft: 12, color: '#00B42A', fontWeight: 500 }}>
                定金 {paid}/{total}
              </Text>
            )}
          </View>
        </View>
        {remaining > 0 && (
          <View className={styles.tip}>当前还差 {remaining} 人成车</View>
        )}
        {genderTip && car.status !== 'finished' && car.status !== 'confirmed' && (
          <View className={styles.tip} style={{ background: 'rgba(123,75,255,0.12)', color: '#9B7DFF' }}>
            {genderTip}
          </View>
        )}
      </View>

      <View className={styles.players}>
        {car.players.slice(0, 8).map(p => (
          <PlayerAvatar key={p.id} player={p} />
        ))}
        {car.players.length < 8 && !car.finalConfirmed && car.status !== 'finished' && car.status !== 'cancelled' && (
          Array.from({ length: Math.min(3, 8 - car.players.length) }).map((_, i) => (
            <View key={`empty-${i}`} className={styles.emptySlot}>
              <View className={styles.slotAvatar}>+</View>
              <Text className={styles.slotText}>等你</Text>
            </View>
          ))
        )}
        {car.finalConfirmed && car.status !== 'finished' && car.status !== 'cancelled' && (
          <View className={styles.lockedTag}>🔒 名单已锁定</View>
        )}
      </View>

      {showQuickActions && (
        <View className={styles.quickActions}>
          {onViewList && (
            <View
              className={classnames(styles.quickBtn, styles.quickBtnOutline)}
              onClick={(e) => { e.stopPropagation(); onViewList(); }}
            >
              📋 看名单
            </View>
          )}
          {onCopyInfo && (
            <View
              className={classnames(styles.quickBtn, styles.quickBtnOutline)}
              onClick={(e) => { e.stopPropagation(); onCopyInfo(); }}
            >
              📤 复制
            </View>
          )}
          {onManageDeposit && (
            <View
              className={classnames(styles.quickBtn, styles.quickBtnOutline)}
              onClick={(e) => { e.stopPropagation(); onManageDeposit(); }}
            >
              💰 定金
            </View>
          )}
          {onSendNotice && (
            <View
              className={classnames(styles.quickBtn, styles.quickBtnPrimary)}
              onClick={(e) => { e.stopPropagation(); onSendNotice(); }}
            >
              📢 发提醒
            </View>
          )}
        </View>
      )}

      {showActions && !showQuickActions && car.status !== 'finished' && car.status !== 'cancelled' && (
        <View className={styles.footer}>
          {secondaryText && (
            <View
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={(e) => { e.stopPropagation(); onSecondary && onSecondary(); }}
            >
              {secondaryText}
            </View>
          )}
          <View
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={(e) => { e.stopPropagation(); onPrimary ? onPrimary() : handleClick(); }}
          >
            {primaryText || '查看详情'}
          </View>
        </View>
      )}
    </View>
  );
};

export default CarCard;
