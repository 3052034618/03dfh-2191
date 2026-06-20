import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import {
  formatDate, getConfirmedCount, getRemainingCount, getGenderCount, calcDepositTotal,
  getStatusText, getDepositCount, generateInvitationText, getDepositLedger,
  getArrivalProgress, getArrivalStatusText, getArrivalStatusColor, formatArrivalTime
} from '@/utils';
import { ArrivalStatus } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const CarDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id;
  const {
    cars, currentUser, storeNotice, sendDepositReminder, sendNotice,
    confirmFinalList, dms, scripts, togglePlayerDeposit, setPlayerArrivalStatus
  } = useStore();

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
  const canConfirmFinal = isCaptain && !car.finalConfirmed && confirmed >= car.minPlayers && car.status !== 'finished' && car.status !== 'cancelled';
  const { male, female } = getGenderCount(car.players);
  const depositTotal = calcDepositTotal(car);
  const { paid, total, unpaid } = getDepositCount(car);
  const ledger = getDepositLedger(car);
  const depositProgress = total > 0 ? Math.round((paid / total) * 100) : 0;
  const arrivalProg = getArrivalProgress(car);

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
      content: `已确认 ${confirmed} 人，达到最低开车人数（${car.minPlayers}人），确认后车局状态将锁定为"已成车"，是否继续？`,
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          confirmFinalList(car.id);
          Taro.showToast({ title: '名单已确认，车局已锁定', icon: 'success' });
        }
      }
    });
  };

  const handleInvite = () => {
    Taro.showToast({ title: '邀请链接已复制', icon: 'success' });
  };

  const handleCopyAll = () => {
    const text = generateInvitationText(car, storeNotice, !!car.finalConfirmed, 'all');
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '通用版已复制', icon: 'success' })
    });
  };

  const handleCopyPaid = () => {
    const text = generateInvitationText(car, storeNotice, !!car.finalConfirmed, 'paid');
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '已付版已复制', icon: 'success' })
    });
  };

  const handleCopyUnpaid = () => {
    const text = generateInvitationText(car, storeNotice, !!car.finalConfirmed, 'unpaid');
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '催付版已复制', icon: 'success' })
    });
  };

  const handleCopyMenu = () => {
    if (!car.finalConfirmed) {
      handleCopyAll();
      return;
    }
    Taro.showActionSheet({
      itemList: [
        '📋 复制通用版（完整信息）',
        '🎮 复制给已付定金的人（突出到店）',
        '💴 复制给未付定金的人（突出催付）'
      ],
      success: (res) => {
        if (res.tapIndex === 0) handleCopyAll();
        else if (res.tapIndex === 1) handleCopyPaid();
        else if (res.tapIndex === 2) handleCopyUnpaid();
      }
    });
  };

  const handleViewFinalList = () => {
    const confirmedPlayers = car.players.filter(p => p.confirmed);
    const list = confirmedPlayers.map((p, i) =>
      `${i + 1}. ${p.name}${p.role === '车头' ? '（车头）' : ''}  ${p.depositPaid ? '✓已付定金' : '⏳待付定金'}  [${getArrivalStatusText(p.arrivalStatus)}]`
    ).join('\n');
    Taro.showModal({
      title: `🔒 已锁定最终名单（${paid}/${total}已付·${arrivalProg.arrived.length + arrivalProg.confirmed.length}/${arrivalProg.total}到店）`,
      content: list,
      showCancel: false,
      confirmColor: '#7B4BFF'
    });
  };

  const handleToggleDeposit = (playerId: string, playerName: string, isPaid: boolean) => {
    Taro.showModal({
      title: isPaid ? '取消定金标记' : '标记已付定金',
      content: isPaid
        ? `确定将「${playerName}」改为未付定金？`
        : `确定将「${playerName}」标记为已付¥${car.depositAmount}定金？`,
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          togglePlayerDeposit(car.id, playerId, !isPaid);
          Taro.showToast({ title: `已${isPaid ? '取消' : '标记'}`, icon: 'success' });
        }
      }
    });
  };

  const handleRemindSingleDeposit = (playerId: string, playerName: string) => {
    Taro.showModal({
      title: '单独发送定金提醒',
      content: `确定单独向「${playerName}」发送定金提醒？（不会重置其他已付状态）`,
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          sendDepositReminder(car.id, playerId);
          Taro.showToast({ title: '已单独提醒', icon: 'success' });
        }
      }
    });
  };

  const handleRemindSingleArrival = (playerId: string, playerName: string) => {
    Taro.showModal({
      title: '单独发送到店提醒',
      content: `确定单独向「${playerName}」发送到店提醒？`,
      confirmColor: '#7B4BFF',
      success: (res) => {
        if (res.confirm) {
          sendNotice(car.id, playerId);
          Taro.showToast({ title: '已单独提醒', icon: 'success' });
        }
      }
    });
  };

  const handleSetArrival = (playerId: string, playerName: string, status: ArrivalStatus) => {
    setPlayerArrivalStatus(car.id, playerId, status);
    Taro.showToast({ title: `${playerName}: ${getArrivalStatusText(status)}`, icon: 'success' });
  };

  const handleArrivalMenu = (playerId: string, playerName: string, _currentStatus?: ArrivalStatus) => {
    if (!canManage) return;
    const items = [
      '📤 发送到店提醒',
      '✅ 标记：已确认到店',
      '🏠 标记：已到店',
      '↩️  重置为未提醒'
    ];
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) handleRemindSingleArrival(playerId, playerName);
        else if (res.tapIndex === 1) handleSetArrival(playerId, playerName, 'confirmed');
        else if (res.tapIndex === 2) handleSetArrival(playerId, playerName, 'arrived');
        else if (res.tapIndex === 3) handleSetArrival(playerId, playerName, 'not_reminded');
      }
    });
  };

  const displayStatusText = getStatusText(car.status, car.finalConfirmed);

  const arrivalStats = [
    { label: '未提醒', count: arrivalProg.notReminded.length, color: '#86909C', key: 'notReminded' },
    { label: '已提醒', count: arrivalProg.reminded.length, color: '#FF7D54', key: 'reminded' },
    { label: '已确认', count: arrivalProg.confirmed.length, color: '#00B42A', key: 'confirmed' },
    { label: '已到店', count: arrivalProg.arrived.length, color: '#7B4BFF', key: 'arrived' }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.statusBar}>
          <View>
            <StatusBadge status={car.status} finalConfirmed={car.finalConfirmed} />
            <Text className={styles.carId}> 车局编号 #{car.id.slice(-6).toUpperCase()} · {displayStatusText}</Text>
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
                : `已达成 ${car.minPlayers} 人最低开车人数，${isCaptain && !car.finalConfirmed ? '你可以确认最终名单来锁定车局！' : '车局可以成行啦～'}`}
              {car.finalConfirmed && ' 车局已锁定，等待开本。'}
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

      {car.finalConfirmed && (
        <>
          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <Text>� 收款台账</Text>
              <Text className={styles.cardCount}>
                应收 ¥{ledger.totalReceivable} / 已收 ¥{ledger.totalReceived}
              </Text>
            </View>

            <View className={styles.ledgerGrid}>
              <View className={styles.ledgerItem}>
                <Text className={styles.ledgerValue}>¥{ledger.totalReceivable}</Text>
                <Text className={styles.ledgerLabel}>应收总额</Text>
              </View>
              <View className={styles.ledgerItem} style={{ borderColor: '#00B42A' }}>
                <Text className={styles.ledgerValue} style={{ color: '#00B42A' }}>¥{ledger.totalReceived}</Text>
                <Text className={styles.ledgerLabel}>已收（{ledger.paidPlayers.length}人）</Text>
              </View>
              <View className={styles.ledgerItem} style={{ borderColor: '#F53F3F' }}>
                <Text className={styles.ledgerValue} style={{ color: '#F53F3F' }}>¥{ledger.totalPending}</Text>
                <Text className={styles.ledgerLabel}>待收（{ledger.unpaidPlayers.length}人）</Text>
              </View>
            </View>

            <View className={styles.depositProgress}>
              <View className={styles.depositProgressHeader}>
                <Text className={styles.depositProgressTitle}>定金收取进度</Text>
                <Text className={styles.depositProgressValue}>
                  {paid}/{total} 人 · ¥{paid * car.depositAmount}/¥{total * car.depositAmount}
                </Text>
              </View>
              <View className={styles.depositProgressBar}>
                <View
                  className={styles.depositProgressFill}
                  style={{ width: `${depositProgress}%` }}
                />
              </View>
              {unpaid.length > 0 && (
                <Text className={styles.depositUnpaid}>
                  待付：{unpaid.map(p => p.name).join('、')}
                </Text>
              )}
            </View>
          </View>

          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <Text>🏠 到店进度</Text>
              <Text className={styles.cardCount}>
                {arrivalProg.arrived.length + arrivalProg.confirmed.length}/{arrivalProg.total} 人
              </Text>
            </View>

            <View className={styles.arrivalStats}>
              {arrivalStats.map(s => (
                <View key={s.key} className={styles.arrivalStatItem}>
                  <View className={styles.arrivalStatDot} style={{ background: s.color }} />
                  <Text className={styles.arrivalStatCount} style={{ color: s.color }}>{s.count}</Text>
                  <Text className={styles.arrivalStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View className={styles.arrivalTip}>
              <Text style={{ color: '#9B7DFF' }}>⏰ 建议到店：</Text>
              <Text>{formatArrivalTime(car.date, car.startTime)}</Text>
            </View>
          </View>
        </>
      )}

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
                {car.depositSent && canManage && p.confirmed && (
                  <View
                    className={classnames(
                      styles.depositMark,
                      p.depositPaid ? styles.depositPaid : styles.depositUnpaid
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDeposit(p.id, p.name, !!p.depositPaid);
                    }}
                  >
                    {p.depositPaid ? '✓ 已付' : '待付'}
                  </View>
                )}
              </View>
              <Text className={styles.playerName}>{p.name}</Text>
              <Text className={styles.playerStatus} style={{ color: p.confirmed ? '#00B42A' : '#FF7D00' }}>
                {p.confirmed ? '已确认' : '待确认'}
              </Text>
              {car.finalConfirmed && p.confirmed && (
                <Text
                  className={styles.playerArrivalStatus}
                  style={{ color: getArrivalStatusColor(p.arrivalStatus) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArrivalMenu(p.id, p.name, p.arrivalStatus);
                  }}
                >
                  {canManage ? '📋 ' : ''}{getArrivalStatusText(p.arrivalStatus)}
                </Text>
              )}
              {car.depositSent && !p.depositPaid && canManage && p.confirmed && (
                <View
                  className={styles.playerRemindBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemindSingleDeposit(p.id, p.name);
                  }}
                >
                  📩 催定金
                </View>
              )}
            </View>
          ))}

          {car.players.length < car.maxPlayers && !car.finalConfirmed && car.status !== 'finished' && car.status !== 'cancelled' && (
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
                <View className={styles.noticeTag}>💰 已发送定金提醒{car.depositSentAt ? ` · ${car.depositSentAt.slice(5, 16).replace('T', ' ')}` : ''}</View>
                <Text className={styles.noticeText}>
                  📌 {storeNotice.depositRule}
                </Text>
                <Text className={styles.noticeText} style={{ color: '#FF7D54', fontWeight: 500 }}>
                  当前应收取定金：{confirmed} × ¥{car.depositAmount} = <Text style={{ fontSize: 32, fontWeight: 700 }}>¥{depositTotal}</Text>
                  （已收¥{ledger.totalReceived}/待收¥{ledger.totalPending}）
                </Text>
              </View>
            )}
            {car.noticeSent && (
              <View className={styles.noticeCard}>
                <View className={styles.noticeTag}>📢 已发送到店须知{car.noticeSentAt ? ` · ${car.noticeSentAt.slice(5, 16).replace('T', ' ')}` : ''}</View>
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
              className={classnames(styles.btn, car.depositSent ? styles.btnOutline : styles.btnOutline)}
              onClick={handleSendDeposit}
              style={{ minWidth: 220, flex: 'unset', marginBottom: 12 }}
            >
              {car.depositSent ? '📤 重发定金提醒' : '📤 发送定金提醒'}
            </View>
            <View
              className={classnames(styles.btn, car.noticeSent ? styles.btnOutline : styles.btnOutline)}
              onClick={handleSendNotice}
              style={{ minWidth: 220, flex: 'unset', marginBottom: 12 }}
            >
              {car.noticeSent ? '📢 重发到店须知' : '📢 发送到店须知'}
            </View>
            <View
              className={classnames(styles.btn, styles.btnAccent)}
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
          {isCaptain && !car.finalConfirmed && car.status !== 'finished' && car.status !== 'cancelled' && (
            <View className={classnames(styles.btn, styles.btnOutline)} onClick={handleInvite}>
              邀请好友
            </View>
          )}
          {car.finalConfirmed && car.status !== 'finished' && car.status !== 'cancelled' && (
            <>
              <View
                className={classnames(styles.btn, styles.btnOutline)}
                onClick={handleViewFinalList}
              >
                📋 查看锁定名单
              </View>
              <View
                className={classnames(styles.btn, styles.btnOutline)}
                onClick={handleCopyMenu}
              >
                📤 复制邀请信息
              </View>
              {canManage && !car.noticeSent && (
                <View className={classnames(styles.btn, styles.btnAccent, styles.btnFull)} onClick={handleSendNotice}>
                  📢 发送到店提醒
                </View>
              )}
              {canManage && car.noticeSent && (
                <View className={classnames(styles.btn, styles.btnPrimary, styles.btnFull)}>
                  🔒 {displayStatusText} · {arrivalProg.arrived.length + arrivalProg.confirmed.length}/{arrivalProg.total}人到店
                </View>
              )}
            </>
          )}
          {canConfirmFinal && (
            <View className={classnames(styles.btn, styles.btnAccent, styles.btnFull)} onClick={handleConfirmList}>
              ✅ 确认最终名单（{confirmed}/{car.minPlayers}人已达标）
            </View>
          )}
          {!car.finalConfirmed && !canConfirmFinal && car.status !== 'finished' && car.status !== 'cancelled' && (
            <View className={classnames(styles.btn, styles.btnPrimary, styles.btnFull)}>
              查看/修改信息
            </View>
          )}
          {car.status === 'finished' && (
            <View className={classnames(styles.btn, styles.btnPrimary, styles.btnFull)}>
              查看复盘
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default CarDetailPage;
