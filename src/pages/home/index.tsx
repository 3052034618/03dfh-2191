import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import ScriptCard from '@/components/ScriptCard';
import EmptyState from '@/components/EmptyState';
import { ScriptType } from '@/types';
import { formatDate, getConfirmedCount, getRemainingCount } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

const ALL_TYPES: (ScriptType | '全部')[] = ['全部', '硬核推理', '情感沉浸', '恐怖惊悚', '欢乐机制', '阵营对抗', '还原本'];

const HomePage: React.FC = () => {
  const { scripts, cars, currentUser, rooms } = useStore();
  const [activeType, setActiveType] = useState<ScriptType | '全部'>('全部');

  const filteredScripts = useMemo(() => {
    let list = scripts.filter(s => s.inStock);
    if (activeType !== '全部') {
      list = list.filter(s => s.type === activeType);
    }
    return list;
  }, [scripts, activeType]);

  const myActiveCars = useMemo(() => {
    return cars.filter(car => {
      if (car.status === 'finished' || car.status === 'cancelled') return false;
      return car.captainId === currentUser.id ||
             car.players.some(p => p.id === currentUser.id);
    });
  }, [cars, currentUser.id]);

  const upcomingRooms = useMemo(() => {
    return rooms.map(room => {
      const availSlots = room.availableSlots.filter(s => s.available).slice(0, 4);
      return { ...room, displaySlots: availSlots };
    }).filter(r => r.displaySlots.length > 0).slice(0, 4);
  }, [rooms]);

  const onRefresh = () => {
    setTimeout(() => Taro.stopPullDownRefresh(), 500);
  };

  React.useEffect(() => {
    Taro.eventCenter.on('onPullDownRefresh', onRefresh);
    return () => {
      Taro.eventCenter.off('onPullDownRefresh', onRefresh);
    };
  }, []);

  const goCreate = () => Taro.switchTab({ url: '/pages/create/index' });
  const goCars = () => Taro.switchTab({ url: '/pages/cars/index' });
  const goAdmin = () => Taro.navigateTo({ url: '/pages/admin/index' });
  const goInviteDemo = () => Taro.navigateTo({ url: '/pages/invite/index?carId=c001' });

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.heroBg} />
      <View className={styles.hero}>
        <Text className={styles.greeting}>晚上好，{currentUser.name.split('（')[0]} 👋</Text>
        <Text className={styles.subGreeting}>今天想玩什么本？让车头带你飞～</Text>

        <View className={styles.quickGrid}>
          <View className={styles.quickItem} onClick={goCreate}>
            <View className={`${styles.quickIcon} ${styles.q1}`}>🎲</View>
            <Text className={styles.quickText}>发起车局</Text>
          </View>
          <View className={styles.quickItem} onClick={goCars}>
            <View className={`${styles.quickIcon} ${styles.q2}`}>🚗</View>
            <Text className={styles.quickText}>我的车局</Text>
          </View>
          <View className={styles.quickItem} onClick={goInviteDemo}>
            <View className={`${styles.quickIcon} ${styles.q3}`}>✉️</View>
            <Text className={styles.quickText}>邀请确认</Text>
          </View>
          <View className={styles.quickItem} onClick={goAdmin}>
            <View className={`${styles.quickIcon} ${styles.q4}`}>⚙️</View>
            <Text className={styles.quickText}>店员后台</Text>
          </View>
        </View>
      </View>

      {myActiveCars.length > 0 && (
        <View className={styles.section}>
          <View className={styles.carReminder}>
            <View className={styles.reminderTitle}>
              <Text>📢 我的车局提醒</Text>
              <View className={styles.reminderBadge}>{myActiveCars.length}个进行中</View>
            </View>
            {myActiveCars.slice(0, 2).map(car => {
              const confirmed = getConfirmedCount(car);
              const remaining = getRemainingCount(car);
              return (
                <View
                  key={car.id}
                  className={styles.reminderItem}
                  onClick={() => Taro.navigateTo({ url: `/pages/car-detail/index?id=${car.id}` })}
                >
                  <Text className={styles.reminderScript}>
                    「{car.scriptName}」
                    {remaining > 0 && <Text style={{ color: '#FF7D54', marginLeft: 12 }}>还差{remaining}人</Text>}
                    {remaining === 0 && <Text style={{ color: '#00B42A', marginLeft: 12 }}>已满员</Text>}
                  </Text>
                  <View className={styles.reminderMeta}>
                    <Text>🕐 {formatDate(car.date)} {car.startTime}</Text>
                    <Text>📍 {car.roomName}</Text>
                    <Text>👥 {confirmed}/{car.minPlayers}人</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>🏠 空房时段</Text>
          <Text className={styles.sectionMore} onClick={goCreate}>去约车 →</Text>
        </View>
        <ScrollView className={styles.roomsScroll} scrollX enhanced showScrollbar={false}>
          {upcomingRooms.map(room => (
            <View
              key={room.id}
              className={styles.roomPreview}
              onClick={goCreate}
            >
              <View className={styles.roomHeader}>
                <Text className={styles.roomName}>{room.name}</Text>
                <View className={styles.roomCapacity}>容{room.capacity}人</View>
              </View>
              <Text className={styles.roomTheme}>{room.theme}</Text>
              <View className={styles.roomSlots}>
                {room.displaySlots.map(s => (
                  <View key={s.id} className={styles.roomSlot}>
                    {formatDate(s.date)} {s.startTime}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>🎬 店家可约清单</Text>
        </View>

        <ScrollView className={styles.typeTabs} scrollX enhanced showScrollbar={false}>
          {ALL_TYPES.map(type => (
            <View
              key={type}
              className={classnames(styles.typeTab, activeType === type && styles.typeTabActive)}
              onClick={() => setActiveType(type)}
            >
              {type}
            </View>
          ))}
        </ScrollView>

        {filteredScripts.length === 0 ? (
          <EmptyState icon="🎭" title="暂无可约本" desc="店家正在更新库存，稍后再来～" />
        ) : (
          filteredScripts.map(script => (
            <ScriptCard key={script.id} script={script} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
