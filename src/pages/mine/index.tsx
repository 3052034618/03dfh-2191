import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import { UserRole } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { currentUser, setCurrentUser, users, cars } = useStore();
  const [activeRole, setActiveRole] = useState<UserRole>(currentUser.role);

  const playStats = React.useMemo(() => {
    const mine = cars.filter(c =>
      c.captainId === currentUser.id || c.players.some(p => p.id === currentUser.id)
    );
    const captainTimes = mine.filter(c => c.captainId === currentUser.id && c.status === 'finished').length;
    const playTimes = mine.filter(c => c.status === 'finished').length;
    const organized = cars.filter(c => c.captainId === currentUser.id).length;
    const invited = cars.reduce((sum, c) => sum + c.players.filter(p => p.id !== c.captainId).length, 0);
    return { playTimes, captainTimes, organized, invited };
  }, [cars, currentUser.id]);

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'staff') {
      const staffUser = users.find(u => u.role === 'staff');
      if (staffUser) {
        setCurrentUser(staffUser);
        Taro.showToast({ title: '已切换为店员身份', icon: 'none' });
      }
    } else {
      const regularUser = users.find(u => u.id === 'u001');
      if (regularUser) {
        setCurrentUser(regularUser);
        Taro.showToast({ title: '已切换为熟客身份', icon: 'none' });
      }
    }
  };

  const goAdmin = () => Taro.navigateTo({ url: '/pages/admin/index' });
  const goInvite = () => Taro.navigateTo({ url: '/pages/invite/index?carId=c001' });
  const goCar = () => {
    if (cars.length > 0) {
      Taro.navigateTo({ url: `/pages/car-detail/index?id=${cars[0].id}` });
    }
  };

  const MenuItem = ({
    icon, iconClass, label, badge, onClick
  }: {
    icon: string; iconClass: string; label: string; badge?: string; onClick?: () => void;
  }) => (
    <View className={styles.menuItem} onClick={onClick}>
      <View className={`${styles.menuIcon} ${iconClass}`}>{icon}</View>
      <Text className={styles.menuLabel}>{label}</Text>
      {badge && <View className={styles.menuBadge}>{badge}</View>}
      <Text className={styles.menuArrow}>›</Text>
    </View>
  );

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <Image className={styles.avatar} src={currentUser.avatar} mode="aspectFill" />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>
              {currentUser.name}
              {currentUser.isRegular && <View className={styles.vipBadge}>⭐熟客VIP</View>}
            </Text>
            <Text className={styles.userMeta}>
              {currentUser.phone} · 累计打本 {currentUser.totalPlays} 次
            </Text>
            <View className={styles.roleSwitcher}>
              <View
                className={classnames(styles.roleItem, activeRole === 'captain' && styles.roleItemActive)}
                onClick={() => handleRoleSwitch('captain')}
              >
                熟客/车头
              </View>
              <View
                className={classnames(styles.roleItem, activeRole === 'staff' && styles.roleItemActive)}
                onClick={() => handleRoleSwitch('staff')}
              >
                店员
              </View>
            </View>
          </View>
        </View>

        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{playStats.playTimes}</Text>
            <Text className={styles.statLabel}>总场次</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{playStats.captainTimes}</Text>
            <Text className={styles.statLabel}>车头次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{playStats.organized}</Text>
            <Text className={styles.statLabel}>组织车局</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{playStats.invited}</Text>
            <Text className={styles.statLabel}>邀请好友</Text>
          </View>
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.menuTitle}>常用功能</Text>
        <View className={styles.menuCard}>
          <MenuItem
            icon="⚙️"
            iconClass={styles.icon1}
            label="店员后台（演示）"
            onClick={goAdmin}
          />
          <MenuItem
            icon="🚗"
            iconClass={styles.icon2}
            label="我的车局"
            onClick={() => Taro.switchTab({ url: '/pages/cars/index' })}
          />
          <MenuItem
            icon="✉️"
            iconClass={styles.icon3}
            label="邀请确认页面"
            onClick={goInvite}
          />
          <MenuItem
            icon="📋"
            iconClass={styles.icon4}
            label="车局详情页（成车提醒）"
            onClick={goCar}
          />
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.menuTitle}>熟客权益</Text>
        <View className={styles.menuCard}>
          <MenuItem
            icon="🎁"
            iconClass={styles.icon5}
            label="熟客专属折扣"
            badge="VIP"
          />
          <MenuItem
            icon="🎯"
            iconClass={styles.icon6}
            label="首发起立减权益"
          />
          <MenuItem
            icon="💬"
            iconClass={styles.icon3}
            label="联系门店客服"
          />
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.menuTitle}>关于</Text>
        <View className={styles.menuCard}>
          <MenuItem icon="📖" iconClass={styles.icon4} label="用户协议" />
          <MenuItem icon="🔒" iconClass={styles.icon2} label="隐私政策" />
          <MenuItem icon="ℹ️" iconClass={styles.icon1} label="版本号 v1.0.0" />
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
