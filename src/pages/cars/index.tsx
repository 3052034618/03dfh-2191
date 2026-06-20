import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import CarCard from '@/components/CarCard';
import EmptyState from '@/components/EmptyState';
import { CarStatus, Car } from '@/types';
import { getConfirmedCount, generateInvitationText, getDepositCount } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

type RoleFilter = 'all' | 'captain' | 'player';
type StatusFilter = 'all' | CarStatus;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '招募中', value: 'recruiting' },
  { label: '即将满车', value: 'almost_full' },
  { label: '已成车/已锁定', value: 'confirmed' },
  { label: '进行中', value: 'playing' },
  { label: '已结束', value: 'finished' }
];

const CarsPage: React.FC = () => {
  const {
    cars,
    currentUser,
    updatePlayer,
    confirmFinalList,
    sendNotice,
    sendDepositReminder,
    togglePlayerDeposit,
    storeNotice
  } = useStore();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredCars = useMemo(() => {
    let list = [...cars];

    if (roleFilter === 'captain') {
      list = list.filter(c => c.captainId === currentUser.id);
    } else if (roleFilter === 'player') {
      list = list.filter(c => c.captainId !== currentUser.id && c.players.some(p => p.id === currentUser.id));
    } else {
      list = list.filter(c => c.captainId === currentUser.id || c.players.some(p => p.id === currentUser.id));
    }

    if (statusFilter !== 'all') {
      list = list.filter(c => c.status === statusFilter);
    }

    return list;
  }, [cars, currentUser.id, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const related = cars.filter(c =>
      c.captainId === currentUser.id || c.players.some(p => p.id === currentUser.id)
    );
    const captainCount = related.filter(c => c.captainId === currentUser.id && c.status !== 'finished' && c.status !== 'cancelled').length;
    const pendingConfirm = related.reduce((sum, car) => {
      if (car.status === 'finished' || car.status === 'cancelled') return sum;
      if (car.captainId === currentUser.id) {
        return sum + car.players.filter(p => !p.confirmed).length;
      }
      const me = car.players.find(p => p.id === currentUser.id);
      return sum + (me && !me.confirmed ? 1 : 0);
    }, 0);
    const totalPlayed = related.filter(c => c.status === 'finished').reduce(
      (sum, c) => sum + getConfirmedCount(c) * 0 + (c.status === 'finished' ? 1 : 0), 0
    );
    return { captainCount, pendingConfirm, totalPlayed };
  }, [cars, currentUser.id]);

  const handleViewList = (car: Car) => {
    const confirmed = car.players.filter(p => p.confirmed);
    const { paid, total } = getDepositCount(car);
    const list = confirmed.map((p, i) => `${i + 1}. ${p.name}${p.depositPaid ? ' ✓已付' : ' ⏳待付'}`).join('\n');
    Taro.showModal({
      title: `🔒 已锁定最终名单（${paid}/${total}已付定金）`,
      content: list,
      showCancel: false,
      confirmColor: '#7B4BFF'
    });
  };

  const handleCopyInfo = (car: Car) => {
    const text = generateInvitationText(car, storeNotice, !!car.finalConfirmed);
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '邀请信息已复制', icon: 'success' })
    });
  };

  const handleSendNotice = (car: Car) => {
    if (car.noticeSent && car.depositSent) {
      Taro.showToast({ title: '已发送过全部提醒', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '一键发送提醒',
      content: '将向所有玩家发送定金提醒和到店须知？',
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          if (!car.depositSent) sendDepositReminder(car.id);
          if (!car.noticeSent) sendNotice(car.id);
          Taro.showToast({ title: '已发送全部提醒', icon: 'success' });
        }
      }
    });
  };

  const handleManageDeposit = (car: Car) => {
    const confirmed = car.players.filter(p => p.confirmed);
    const options = confirmed.map(p =>
      `${p.name}  ${p.depositPaid ? '✅已付' : '⏳待付'}  ¥${car.depositAmount}`
    );
    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        const player = confirmed[res.tapIndex];
        if (player.depositPaid) {
          Taro.showModal({
            title: '取消定金标记',
            content: `确定将「${player.name}」改为未付定金？`,
            confirmColor: '#7B4BFF',
            success: (r) => {
              if (r.confirm) {
                togglePlayerDeposit(car.id, player.id, false);
                Taro.showToast({ title: '已改为未付', icon: 'success' });
              }
            }
          });
        } else {
          Taro.showModal({
            title: '标记已付定金',
            content: `确定将「${player.name}」标记为已付¥${car.depositAmount}定金？`,
            confirmColor: '#7B4BFF',
            success: (r) => {
              if (r.confirm) {
                togglePlayerDeposit(car.id, player.id, true);
                Taro.showToast({ title: '已标记已付', icon: 'success' });
              }
            }
          });
        }
      }
    });
  };

  const getActionProps = (car: Car) => {
    const isCaptain = car.captainId === currentUser.id;
    const me = car.players.find(p => p.id === currentUser.id);
    const confirmed = getConfirmedCount(car);
    const isStaff = currentUser.role === 'staff' || currentUser.role === 'owner';
    const canManage = isCaptain || isStaff;
    const isLocked = car.finalConfirmed && car.status === 'confirmed';

    if (car.status === 'finished' || car.status === 'cancelled') {
      return {};
    }

    if (isLocked) {
      const props: any = {};
      props.onViewList = () => handleViewList(car);
      props.onCopyInfo = () => handleCopyInfo(car);
      if (canManage) {
        props.onManageDeposit = () => handleManageDeposit(car);
        if (!car.noticeSent || !car.depositSent) {
          props.onSendNotice = () => handleSendNotice(car);
        }
      }
      return props;
    }

    if (isCaptain) {
      if (!car.finalConfirmed && confirmed >= car.minPlayers) {
        return {
          primaryText: '确认最终名单',
          onPrimary: () => confirmFinalList(car.id)
        };
      }
      return {
        primaryText: '管理车局',
        secondaryText: car.acceptStrangers ? '接受拼人' : '仅熟人'
      };
    }

    if (me && !me.confirmed) {
      return {
        primaryText: '确认参加',
        onPrimary: () => updatePlayer(car.id, currentUser.id, { confirmed: true }),
        secondaryText: '婉拒',
        onSecondary: () => updatePlayer(car.id, currentUser.id, { confirmed: false })
      };
    }

    return {};
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statsRow}>
        <View className={`${styles.statCard} ${styles.stat1}`}>
          <Text className={styles.statNum}>{stats.captainCount}</Text>
          <Text className={styles.statLabel}>我组织的车</Text>
        </View>
        <View className={`${styles.statCard} ${styles.stat2}`}>
          <Text className={styles.statNum}>{stats.pendingConfirm}</Text>
          <Text className={styles.statLabel}>待确认</Text>
        </View>
        <View className={`${styles.statCard} ${styles.stat3}`}>
          <Text className={styles.statNum}>{stats.totalPlayed}</Text>
          <Text className={styles.statLabel}>已完成场次</Text>
        </View>
      </View>

      <View className={styles.roleTabs}>
        <View
          className={classnames(styles.roleTab, roleFilter === 'all' && styles.roleTabActive)}
          onClick={() => setRoleFilter('all')}
        >
          全部
        </View>
        <View
          className={classnames(styles.roleTab, roleFilter === 'captain' && styles.roleTabActive)}
          onClick={() => setRoleFilter('captain')}
        >
          我是车头
        </View>
        <View
          className={classnames(styles.roleTab, roleFilter === 'player' && styles.roleTabActive)}
          onClick={() => setRoleFilter('player')}
        >
          我是玩家
        </View>
      </View>

      <ScrollView className={styles.statusTabs} scrollX enhanced showScrollbar={false}>
        {STATUS_OPTIONS.map(opt => (
          <View
            key={opt.value}
            className={classnames(styles.statusTab, statusFilter === opt.value && styles.statusTabActive)}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </View>
        ))}
      </ScrollView>

      <View className={styles.listArea}>
        {filteredCars.length === 0 ? (
          <EmptyState
            icon="🚗"
            title="暂无相关车局"
            desc="去首页看看新剧本，或发起一个私密车吧～"
          />
        ) : (
          filteredCars.map(car => (
            <CarCard key={car.id} car={car} {...getActionProps(car)} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default CarsPage;
