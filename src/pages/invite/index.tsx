import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Switch } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import { Gender, Player } from '@/types';
import { formatDate, getConfirmedCount, getRemainingCount, getGenderTip, generateId } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

const InvitePage: React.FC = () => {
  const router = useRouter();
  const carId = router.params.carId || 'car001';
  const { cars, joinCar, updatePlayer, currentUser } = useStore();

  const car = useMemo(() => cars.find(c => c.id === carId), [cars, carId]);
  const existingPlayer = useMemo(
    () => car?.players.find(p => p.id === currentUser.id),
    [car, currentUser.id]
  );

  const [gender, setGender] = useState<Gender>(existingPlayer?.gender || 'male');
  const [bringCount, setBringCount] = useState(0);
  const [acceptStrangers, setAcceptStrangers] = useState(
    existingPlayer?.acceptStrangers ?? false
  );
  const [submitted, setSubmitted] = useState(false);

  if (!car) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🔍</View>
          <Text className={styles.emptyText}>邀请链接无效</Text>
          <Text className={styles.emptySub}>该车局可能已取消或链接已过期</Text>
        </View>
      </View>
    );
  }

  const confirmed = getConfirmedCount(car);
  const remaining = getRemainingCount(car);
  const genderTip = getGenderTip(car.genderRequirement, car.players);
  const maxSlots = car.maxPlayers - car.players.length;

  const handleIncrease = () => {
    if (bringCount < maxSlots - 1) {
      setBringCount(bringCount + 1);
    }
  };

  const handleDecrease = () => {
    if (bringCount > 0) {
      setBringCount(bringCount - 1);
    }
  };

  const handleConfirm = () => {
    if (submitted) return;
    setSubmitted(true);

    if (existingPlayer) {
      updatePlayer(car.id, existingPlayer.id, {
        gender,
        confirmed: true,
        acceptStrangers
      });
    } else {
      const newPlayer: Player = {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        gender,
        confirmed: true,
        acceptStrangers
      };
      joinCar(car.id, newPlayer);

      for (let i = 0; i < bringCount; i++) {
        const friend: Player = {
          id: generateId(),
          name: `${currentUser.name}的朋友${i + 1}`,
          avatar: `https://picsum.photos/id/${1040 + i}/200/200`,
          gender: 'unknown',
          confirmed: true,
          acceptStrangers
        };
        joinCar(car.id, friend);
      }
    }

    Taro.showToast({ title: '已确认参加', icon: 'success' });
    setTimeout(() => {
      Taro.redirectTo({ url: `/pages/car-detail/index?id=${car.id}` });
    }, 1200);
  };

  const handleDecline = () => {
    Taro.showModal({
      title: '婉拒邀请',
      content: '确定要婉拒本次约本邀请吗？',
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          if (existingPlayer) {
            updatePlayer(car.id, existingPlayer.id, { confirmed: false });
          }
          Taro.showToast({ title: '已婉拒', icon: 'none' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/home/index' });
          }, 1000);
        }
      }
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.hero}>
        <View className={styles.inviteBadge}>✉️ 私密邀请函</View>
        <Text className={styles.inviteTitle}>{car.captainName} 邀你一起打本</Text>
        <Text className={styles.inviteSubtitle}>
          {car.acceptStrangers ? '可接受店员匹配熟人补位' : '纯熟人局，放心约～'}
        </Text>
      </View>

      <View className={styles.scriptCard}>
        <View className={styles.scriptHeader}>
          <View className={styles.scriptCover}>
            <Image className={styles.scriptCoverImg} src={car.scriptCover} mode="aspectFill" />
          </View>
          <View className={styles.scriptInfo}>
            <View>
              <Text className={styles.scriptName}>{car.scriptName}</Text>
              <View>
                <View className={styles.typeTag}>{car.minPlayers}-{car.maxPlayers}人本</View>
              </View>
            </View>
            <View>
              <View className={styles.metaRow}>
                🕒 时长约 <Text className={styles.highlight}>6小时</Text>
              </View>
              <View className={styles.metaRow}>
                💰 人均 <Text className={styles.highlight}>¥{car.price}</Text>
              </View>
            </View>
          </View>
        </View>

        {genderTip && (
          <View className={styles.tipBox} style={{ margin: 0 }}>
            <Text className={styles.tipText}>💡 {genderTip}</Text>
          </View>
        )}
      </View>

      <View className={styles.infoSection}>
        <Text className={styles.sectionTitle}>📅 场次信息</Text>
        <View className={styles.timeBox}>
          <Text className={styles.timeMain}>
            {formatDate(car.date)} · {car.startTime} - {car.endTime}
          </Text>
          <Text className={styles.timeSub}>
            房间：{car.roomName} · DM：{car.dmName}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>🚗 车头</Text>
          <View className={styles.playersPreview}>
            <View className={styles.avatarStack}>
              <View className={styles.miniAvatar}>
                <Image className={styles.miniAvatarImg} src={car.captainAvatar} mode="aspectFill" />
              </View>
            </View>
            <Text className={styles.infoValue}>{car.captainName}</Text>
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>👥 已确认</Text>
          <Text className={styles.infoValue}>
            {confirmed} 人
            {remaining > 0 && <Text style={{ color: '#FF7D54', fontSize: 24 }}> · 还差{remaining}人</Text>}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>🎯 定金</Text>
          <Text className={styles.infoValue}>¥{car.depositAmount} / 人（成车后收取）</Text>
        </View>
      </View>

      {car.players.length > 0 && (
        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>🤝 当前伙伴</Text>
          <View className={styles.playersPreview} style={{ justifyContent: 'center', gap: 16 }}>
            <View className={styles.avatarStack}>
              {car.players.slice(0, 6).map(p => (
                <View key={p.id} className={styles.miniAvatar}>
                  <Image className={styles.miniAvatarImg} src={p.avatar} mode="aspectFill" />
                </View>
              ))}
            </View>
            {car.players.length > 6 && (
              <Text className={styles.infoLabel}>+{car.players.length - 6}人</Text>
            )}
          </View>
        </View>
      )}

      <View className={styles.confirmCard}>
        <Text className={styles.sectionTitle}>✅ 确认我的信息</Text>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            <Text className={styles.formLabelRequired}>*</Text> 我的性别
          </Text>
          <View className={styles.genderOptions}>
            <View
              className={classnames(
                styles.genderOption,
                gender === 'male' && styles.genderOptionActiveMale
              )}
              onClick={() => setGender('male')}
            >
              <View className={styles.genderEmoji}>👨</View>
              <Text className={styles.genderText}>男生</Text>
            </View>
            <View
              className={classnames(
                styles.genderOption,
                gender === 'female' && styles.genderOptionActiveFemale
              )}
              onClick={() => setGender('female')}
            >
              <View className={styles.genderEmoji}>👩</View>
              <Text className={styles.genderText}>女生</Text>
            </View>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>带朋友一起？</Text>
          <View className={styles.bringCountRow}>
            <Text className={styles.bringLabel}>同行人数（不含自己）</Text>
            <View className={styles.counter}>
              <View
                className={classnames(styles.counterBtn, bringCount === 0 && styles.counterBtnDisabled)}
                onClick={handleDecrease}
              >
                -
              </View>
              <Text className={styles.counterValue}>{bringCount}</Text>
              <View
                className={classnames(styles.counterBtn, bringCount >= maxSlots - 1 && styles.counterBtnDisabled)}
                onClick={handleIncrease}
              >
                +
              </View>
            </View>
          </View>
          {maxSlots > 1 && (
            <Text style={{ fontSize: 22, color: '#8686A8', marginTop: 8 }}>
              最多还可带 {Math.max(0, maxSlots - 1)} 位朋友
            </Text>
          )}
        </View>

        <View className={styles.formGroup} style={{ marginBottom: 0 }}>
          <Text className={styles.formLabel}>补位设置</Text>
          <View className={styles.switchRow}>
            <View className={styles.switchLabel}>
              <Text className={styles.switchTitle}>接受店员匹配熟人补位</Text>
              <Text className={styles.switchDesc}>
                人数不够时，店员可从熟客名单里帮忙匹配靠谱玩家
              </Text>
            </View>
            <Switch
              checked={acceptStrangers}
              onChange={(e) => setAcceptStrangers(e.detail.value)}
              color="#7B4BFF"
            />
          </View>
        </View>
      </View>

      {remaining > 0 && (
        <View className={styles.tipBox}>
          <Text className={styles.tipText}>
            ⏰ 当前还差 {remaining} 人即可成车，确认后记得提醒其他小伙伴哦～
          </Text>
        </View>
      )}

      <View className={styles.footerBar}>
        <View className={classnames(styles.btn, styles.btnSecondary)} onClick={handleDecline}>
          婉拒
        </View>
        <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleConfirm}>
          {existingPlayer?.confirmed ? '✓ 更新确认' : '确认参加'}
        </View>
      </View>
    </ScrollView>
  );
};

export default InvitePage;
