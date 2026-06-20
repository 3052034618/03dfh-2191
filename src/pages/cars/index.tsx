import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import CarCard from '@/components/CarCard';
import EmptyState from '@/components/EmptyState';
import { CarStatus, Car } from '@/types';
import {
  getConfirmedCount, generateInvitationText, getDepositCount,
  getDepositLedger, getArrivalProgress, getArrivalStatusText
} from '@/utils';
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
    const arrival = getArrivalProgress(car);
    const list = confirmed.map((p, i) =>
      `${i + 1}. ${p.name}${p.depositPaid ? ' ✓已付' : ' ⏳待付'} [${getArrivalStatusText(p.arrivalStatus)}]`
    ).join('\n');
    Taro.showModal({
      title: `🔒 最终名单（${paid}/${total}已付·${arrival.arrived.length + arrival.confirmed.length}/${arrival.total}到店）`,
      content: list,
      showCancel: false,
      confirmColor: '#7B4BFF'
    });
  };

  const handleCopyInfo = (car: Car) => {
    if (!car.finalConfirmed) {
      const text = generateInvitationText(car, storeNotice, false, 'all');
      Taro.setClipboardData({
        data: text,
        success: () => Taro.showToast({ title: '邀请信息已复制', icon: 'success' })
      });
      return;
    }
    Taro.showActionSheet({
      itemList: [
        '📋 复制通用版（完整信息）',
        '🎮 复制给已付的人（突出到店）',
        '💴 复制给未付的人（突出催付）'
      ],
      success: (res) => {
        const audience = res.tapIndex === 0 ? 'all' : res.tapIndex === 1 ? 'paid' : 'unpaid';
        const text = generateInvitationText(car, storeNotice, true, audience as any);
        Taro.setClipboardData({
          data: text,
          success: () => Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
        });
      }
    });
  };

  const handleSendNotice = (car: Car) => {
    Taro.showModal({
      title: '一键发送提醒',
      content: '将向未付玩家重发定金提醒，向所有人重发到店须知？（不会清空已付状态）',
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          sendDepositReminder(car.id);
          sendNotice(car.id);
          Taro.showToast({ title: '已重发全部提醒', icon: 'success' });
        }
      }
    });
  };

  const handleManageDeposit = (car: Car) => {
    const ledger = getDepositLedger(car);
    const options = [
      `📊 台账：应收¥${ledger.totalReceivable} · 已收¥${ledger.totalReceived} · 待收¥${ledger.totalPending}`,
      ...ledger.unpaidPlayers.map(p => `💴 催付：${p.name}（待付¥${car.depositAmount}）`),
      ...ledger.paidPlayers.map(p => `✅ 已付：${p.name}（点击可撤销）`)
    ];
    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        if (res.tapIndex === 0) return;
        const unpaidIdx = res.tapIndex - 1;
        if (unpaidIdx < ledger.unpaidPlayers.length) {
          const player = ledger.unpaidPlayers[unpaidIdx];
          sendDepositReminder(car.id, player.id);
          Taro.showToast({ title: `已单独提醒${player.name}`, icon: 'success' });
        } else {
          const player = ledger.paidPlayers[unpaidIdx - ledger.unpaidPlayers.length];
          Taro.showModal({
            title: '取消定金标记',
            content: `确定将「${player.name}」改为未付？`,
            confirmColor: '#7B4BFF',
            success: (r) => {
              if (r.confirm) {
                togglePlayerDeposit(car.id, player.id, false);
                Taro.showToast({ title: '已改为未付', icon: 'success' });
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
      const arrival = getArrivalProgress(car);
      const props: any = {};
      props.onViewList = () => handleViewList(car);
      props.onCopyInfo = () => handleCopyInfo(car);
      props.arrivalCount = arrival.arrived.length + arrival.confirmed.length;
      props.arrivalTotal = arrival.total;
      if (canManage) {
        props.onManageDeposit = () => handleManageDeposit(car);
        props.onSendNotice = () => handleSendNotice(car);
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
