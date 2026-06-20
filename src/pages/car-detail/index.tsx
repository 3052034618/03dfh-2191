import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, getConfirmedCount, getRemainingCount, getGenderCount, calcDepositTotal } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

const CarDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id;
  const { cars, currentUser, storeNotice, sendDepositReminder, sendNotice, confirmFinalList, dms, scripts } = useStore();

  const car = useMemo(() => cars.find(c => c.id === id), [cars, id]);
  const script = useMemo(() => scripts.find(s => s.id === car?.scriptId), [scripts, car?.scriptId]);
  const dm = useMemo(() => dms.find(d => d.id === car?.dmId), [dms, car?.dmId]);

  if (!car) {
    return <View className={styles.page} style={{ padding: 100, textAlign: 'center', color: '#B0B0C8' }}>车局不存在</View>;
  }

  const confirmed = getConfirmedCount(car);
  const remaining = getRemainingCount(car);
  const progress = Math.min(100, (confirmed / car.minPlayers) * 100);
  const isCaptain = car.captainId === currentUser.id;
  const isStaff = currentUser.role === 'staff' || currentUser.role === 'owner';
  const canManage = isCaptain || isStaff;
  const { male, female } = getGenderCount(car.players);
  const depositTotal = calcDepositTotal(car);

  const needMale = Math.max(0, car.genderRequirement.male - male);
  const needFemale = Math.max(0, car.genderRequirement.female - female);

  const handleSendDeposit = () => {
    sendDepositReminder(car.id);
    Taro.showToast({ title: '定金提醒已发送', icon: 'success' });
  };

  const handleSendNotice = () => {
    sendNotice(car.id);
    Taro.showToast({ title: '到店须知已发送', icon: 'success' });
  };

  const handleSendAll = () => {
    sendDepositReminder(car.id);
    sendNotice(car.id);
    Taro.showToast({ title: '已一键发送全部提醒', icon: 'success' });
  };

  const handleConfirmList = () => {
    Taro.showModal({
      title: '确认最终名单',
      content: `共 ${confirmed} 人确认参加，确认后车局状态将锁定为"已成车"，是否继续？`,
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          confirmFinalList(car.id);
          Taro.showToast({ title: '名单已确认', icon: 'success' });
        }
      }
    });
  };

  const handleInvite = () => {
    Taro.showToast({ title: '邀请链接已复制', icon: 'success' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.statusBar}>
          <View>
            <StatusBadge status={car.status} />
            <Text className={styles.carId}> 车局编号 #{car.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>

        <View className={styles.scriptPreview}>
          <View className={styles.cover}>
            <Image className={styles.coverImg} src={car.scriptCover} mode="aspectFill" />
          </View>
          <View className={styles.info}>
            <View>
              <Text className={styles.name}>{car.scriptName}</Text>
              {script && <View className={styles.typeTag}>{script.type}</View>}
            </View>
            <View className={styles.metaList}>
              <View className={styles.metaTag}>
                🕐 <Text className={styles.highlight}>{formatDate(car.date)}</Text> {car.startTime}-{car.endTime}
              </View>
              <View className={styles.metaTag}>
                📍 <Text className={styles.highlight}>{car.roomName}</Text>
              </View>
              <View className={styles.metaTag}>
                🎙️ <Text className={styles.highlight}>DM {car.dmName}</Text>
              </View>
              <View className={styles.metaTag}>
                🚗 车头 <Text className={styles.highlight}>{car.captainName}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.progressSection}>
          <View className={styles.cardTitle}>
            <Text>🚗 成车进度</Text>
            <Text className={styles.cardCount}>{confirmed}/{car.minPlayers} 人成车</Text>
          </View>
          <View className={styles.progressRow}>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progress}%` }} />
            </View>
            <Text className={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          <View className={styles.smartTip}>
            <Text className={styles.tipTitle}>💡 系统智能提示</Text>
            <Text className={styles.tipText}>
              {remaining > 0
                ? `当前还差 ${remaining} 人即可达最低开车人数，${car.acceptStrangers ? '已开启熟客补位，店员会协助匹配。' : '当前为纯熟人车，请尽快邀请好友确认。'}`
                : `已达成 ${car.minPlayers} 人最低开车人数，`}
              {car.status === 'almost_full' && `人数已接近满车，建议确认最终名单！`}
              {car.status === 'confirmed' && `车局已成，可以通知玩家支付定金啦～`}
            </Text>

            <View className={styles.genderRow}>
              <Text className={styles.genderLabel}>性别构成：</Text>
              <View className={styles.genderChips}>
                <View className={`${styles.chip} ${styles.chipMale}`}>♂ {male}</View>
                <View className={`${styles.chip} ${styles.chipFemale}`}>♀ {female}</View>
                {(needMale > 0 || needFemale > 0) && (
                  <>
                    {needMale > 0 && <View className={`${styles.chip} ${styles.chipNeed}`}>还缺{needMale}男</View>}
                    {needFemale > 0 && <View className={`${styles.chip} ${styles.chipNeed}`}>还缺{needFemale}女</View>}
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <Text>👥 玩家名单</Text>
          <Text className={styles.cardCount}>
            已确认 {confirmed}/{car.maxPlayers} 人
          </Text>
        </View>

        <View className={styles.playersGrid}>
          {car.players.map(p => (
            <View key={p.id} className={styles.playerItem}>
              <View className={classnames(
                styles.playerAvatar,
                p.gender === 'male' && styles.playerMale,
                p.gender === 'female' && styles.playerFemale
              )}>
                <Image className={styles.playerImg} src={p.avatar} mode="aspectFill" />
                {p.role === '车头' && <View className={styles.captainMark}>车头</View>}
                {p.confirmed && p.role !== '车头' && <View className={styles.confirmedMark}>✓</View>}
              </View>
              <Text className={styles.playerName}>{p.name}</Text>
              <Text className={styles.playerStatus} style={{ color: p.confirmed ? '#00B42A' : '#FF7D00' }}>
                {p.confirmed ? '已确认' : '待确认'}
              </Text>
            </View>
          ))}

          {car.players.length < car.maxPlayers && car.status !== 'finished' && car.status !== 'confirmed' && (
            Array.from({ length: Math.min(3, car.maxPlayers - car.players.length) }).map((_, i) => (
              <View key={`slot-${i}`} className={styles.emptySlot}>
                <View className={styles.slotAvatar}>+</View>
                <Text className={styles.slotText}>空位</Text>
              </View>
            ))
          )}
        </View>

        {(car.depositSent || car.noticeSent) && (
          <>
            {car.depositSent && (
              <View className={styles.noticeCard}>
                <View className={styles.noticeTag}>💰 已发送定金提醒</View>
                <Text className={styles.noticeText}>
                  📌 {storeNotice.depositRule}
                </Text>
                <Text className={styles.noticeText} style={{ color: '#FF7D54', fontWeight: 500 }}>
                  当前应收取定金：{confirmed} × ¥{car.depositAmount} = <Text style={{ fontSize: 32, fontWeight: 700 }}>¥{depositTotal}</Text>
                </Text>
              </View>
            )}
            {car.noticeSent && (
              <View className={styles.noticeCard}>
                <View className={styles.noticeTag}>📢 已发送到店须知</View>
                <Text className={styles.noticeText}>🏠 {storeNotice.arrivalNotice}</Text>
                <Text className={styles.noticeText}>⏰ {storeNotice.lateRule}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {canManage && car.status !== 'finished' && car.status !== 'cancelled' && (
        <View className={styles.card}>
          <Text className={styles.sectionTitleSmall}>
            {isStaff ? '🛠️ 店员操作面板' : '🎛️ 车头管理'}
          </Text>
          <View style={{ height: 16 }} />
          <View className={styles.btnRow} style={{ flexWrap: 'wrap' }}>
            <View
              className={classnames(styles.btn, car.depositSent ? styles.btnDisabled : styles.btnOutline)}
              onClick={handleSendDeposit}
              style={{ minWidth: 220, flex: 'unset', marginBottom: 12 }}
            >
              {car.depositSent ? '✓ 已发定金提醒' : '📤 发送定金提醒'}
            </View>
            <View
              className={classnames(styles.btn, car.noticeSent ? styles.btnDisabled : styles.btnOutline)}
              onClick={handleSendNotice}
              style={{ minWidth: 220, flex: 'unset', marginBottom: 12 }}
            >
              {car.noticeSent ? '✓ 已发到店须知' : '📢 发送到店须知'}
            </View>
            <View
              className={classnames(styles.btn, (car.depositSent && car.noticeSent) ? styles.btnDisabled : styles.btnAccent)}
              onClick={handleSendAll}
              style={{ minWidth: 220, flex: 'unset', marginBottom: 12 }}
            >
              🎯 一键发送全部
            </View>
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.footerInfo}>
          <View className={styles.depositInfo}>
            <Text className={styles.depositLabel}>
              预估总价 · {confirmed}人 × ¥{car.price}
            </Text>
            <Text className={styles.depositValue}>
              ¥{confirmed * car.price} <Text style={{ fontSize: 24, color: '#8686A8', fontWeight: 400 }}>· 定金¥{depositTotal}</Text>
            </Text>
          </View>
          {dm && (
            <View style={{ textAlign: 'right' }}>
              <Text className={styles.depositLabel}>推荐DM</Text>
              <Text className={styles.depositValue} style={{ fontSize: 26 }}>
                {dm.name} ⭐{dm.rating}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.btnRow}>
          {isCaptain && car.status !== 'confirmed' && car.status !== 'finished' && (
            <View className={classnames(styles.btn, styles.btnOutline)} onClick={handleInvite}>
              邀请好友
            </View>
          )}
          {car.status === 'confirmed' && !car.finalConfirmed && isCaptain && (
            <View className={classnames(styles.btn, styles.btnAccent, styles.btnFull)} onClick={handleConfirmList}>
              ✅ 确认最终名单
            </View>
          )}
          {(car.status !== 'confirmed' || car.finalConfirmed) && (
            <View className={classnames(styles.btn, styles.btnPrimary, styles.btnFull)}>
              {car.status === 'finished' ? '查看复盘' : car.finalConfirmed ? '车局已锁定 ✓' : '查看/修改信息'}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default CarDetailPage;
