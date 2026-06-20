import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Switch, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import { formatDate, getConfirmedCount, getRemainingCount, getStatusText, getStatusColor, formatDifficulty } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

type AdminTab = 'scripts' | 'rooms' | 'dms' | 'cars';
type CarFilter = 'all' | 'almost' | 'needNotice' | 'confirmed';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('cars');
  const [carFilter, setCarFilter] = useState<CarFilter>('all');
  const [editingDmId, setEditingDmId] = useState<string | null>(null);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [tempMinPlayers, setTempMinPlayers] = useState<number>(0);
  const {
    scripts,
    rooms,
    dms,
    cars,
    storeNotice,
    sendDepositReminder,
    sendNotice,
    updateScript,
    toggleSlot,
    updateDM
  } = useStore();

  const almostFullCount = useMemo(
    () => cars.filter(c => c.status === 'almost_full' || c.status === 'recruiting').length,
    [cars]
  );

  const filteredCars = useMemo(() => {
    let result = [...cars];
    switch (carFilter) {
      case 'almost':
        result = result.filter(c => c.status === 'almost_full');
        break;
      case 'needNotice':
        result = result.filter(c => !c.depositSent || !c.noticeSent);
        break;
      case 'confirmed':
        result = result.filter(c => c.status === 'confirmed' || c.status === 'playing');
        break;
      default:
        break;
    }
    return result;
  }, [cars, carFilter]);

  const handleToggleScriptStock = (scriptId: string, value: boolean) => {
    updateScript(scriptId, { inStock: value });
    Taro.showToast({
      title: value ? '已上架' : '已下架',
      icon: 'success'
    });
  };

  const handleToggleSlot = (roomId: string, slotId: string) => {
    toggleSlot(roomId, slotId);
  };

  const handleToggleDmScript = (dmId: string, scriptId: string, currentIds: string[]) => {
    const newIds = currentIds.includes(scriptId)
      ? currentIds.filter(id => id !== scriptId)
      : [...currentIds, scriptId];
    updateDM(dmId, { scriptIds: newIds });
  };

  const handleEditMinPlayers = (scriptId: string, currentMin: number) => {
    setEditingScriptId(scriptId);
    setTempMinPlayers(currentMin);
  };

  const handleSaveMinPlayers = (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script || tempMinPlayers < 2 || tempMinPlayers > script.maxPlayers) {
      Taro.showToast({ title: '人数需在2到最大人数之间', icon: 'none' });
      return;
    }
    updateScript(scriptId, { minPlayers: tempMinPlayers });
    setEditingScriptId(null);
    Taro.showToast({ title: '最低人数已更新', icon: 'success' });
  };

  const handleSendAllForCar = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    Taro.showModal({
      title: '一键发送全部提醒',
      content: `将向「${car.scriptName}」车局的所有已确认玩家发送定金提醒和到店须知，是否继续？`,
      confirmColor: '#FF7D54',
      success: (res) => {
        if (res.confirm) {
          sendDepositReminder(carId);
          sendNotice(carId);
          Taro.showToast({ title: '已发送全部提醒', icon: 'success' });
        }
      }
    });
  };

  const handleViewCar = (carId: string) => {
    Taro.navigateTo({ url: `/pages/car-detail/index?id=${carId}` });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'scripts' && styles.tabItemActive)}
          onClick={() => setActiveTab('scripts')}
        >
          剧本库存
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'rooms' && styles.tabItemActive)}
          onClick={() => setActiveTab('rooms')}
        >
          房间时段
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'dms' && styles.tabItemActive)}
          onClick={() => setActiveTab('dms')}
        >
          DM排班
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'cars' && styles.tabItemActive)}
          onClick={() => setActiveTab('cars')}
        >
          车局
          {almostFullCount > 0 && <View className={styles.tabBadge}>{almostFullCount}</View>}
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={classnames(styles.statCard, styles.statPrimary)}>
          <Text className={styles.statValue}>{scripts.filter(s => s.inStock).length}</Text>
          <Text className={styles.statLabel}>可约剧本</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statAccent)}>
          <Text className={styles.statValue}>{almostFullCount}</Text>
          <Text className={styles.statLabel}>进行中车局</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statSuccess)}>
          <Text className={styles.statValue}>{cars.filter(c => c.status === 'confirmed' || c.status === 'playing').length}</Text>
          <Text className={styles.statLabel}>已成车</Text>
        </View>
      </View>

      {activeTab === 'scripts' && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📚 可约本清单</Text>
            <Text className={styles.actionLink} onClick={() => Taro.showToast({ title: '新增剧本功能开发中', icon: 'none' })}>
              + 新增
            </Text>
          </View>

          {scripts.map(s => (
            <View key={s.id} className={styles.scriptItem}>
              <View className={styles.scriptCover}>
                <Image className={styles.scriptCoverImg} src={s.cover} mode="aspectFill" />
              </View>
              <View className={styles.scriptBody}>
                <View>
                  <View className={styles.scriptTop}>
                    <Text className={styles.scriptName}>{s.name}</Text>
                    <View className={classnames(
                      styles.statusTag,
                      s.inStock ? styles.statusInStock : styles.statusOutOfStock
                    )}>
                      {s.inStock ? '可约' : '下架'}
                    </View>
                  </View>
                  <View className={styles.scriptMeta}>
                    {s.type} · 约{s.duration}小时
                  </View>
                  <View className={styles.scriptMeta}>
                    难度 {formatDifficulty(s.difficulty)} · 可带DM {s.dmIds.length}位
                  </View>
                  <View className={styles.minPlayersRow}>
                    <Text className={styles.scriptMeta}>最低开车人数：</Text>
                    {editingScriptId === s.id ? (
                      <View className={styles.inlineEdit}>
                        <View
                          className={classnames(styles.counterBtn, tempMinPlayers <= 2 && styles.counterBtnDisabled)}
                          onClick={() => setTempMinPlayers(Math.max(2, tempMinPlayers - 1))}
                        >-</View>
                        <Text className={styles.counterValue}>{tempMinPlayers}</Text>
                        <View
                          className={classnames(styles.counterBtn, tempMinPlayers >= s.maxPlayers && styles.counterBtnDisabled)}
                          onClick={() => setTempMinPlayers(Math.min(s.maxPlayers, tempMinPlayers + 1))}
                        >+</View>
                        <View className={styles.saveBtn} onClick={() => handleSaveMinPlayers(s.id)}>保存</View>
                        <View className={styles.cancelBtn} onClick={() => setEditingScriptId(null)}>取消</View>
                      </View>
                    ) : (
                      <View className={styles.editableValue} onClick={() => handleEditMinPlayers(s.id, s.minPlayers)}>
                        <Text className={styles.highlightNum}>{s.minPlayers}</Text>
                        <Text className={styles.scriptMeta}>-{s.maxPlayers}人</Text>
                        <Text className={styles.editHint}>✏️</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className={styles.scriptBottom}>
                  <View className={styles.tagList}>
                    {s.tags.slice(0, 2).map(t => (
                      <View key={t} className={styles.miniTag}>{t}</View>
                    ))}
                  </View>
                  <Switch
                    checked={s.inStock}
                    className={styles.switchMini}
                    color="#7B4BFF"
                    onChange={(e) => handleToggleScriptStock(s.id, e.detail.value)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'rooms' && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🏠 房间与时段</Text>
            <Text className={styles.actionLink}>今天 · {formatDate(rooms[0]?.availableSlots[0]?.date || new Date().toISOString().slice(0, 10))}</Text>
          </View>

          {rooms.map(r => (
            <View key={r.id} className={styles.roomItem}>
              <View className={styles.roomHeader}>
                <View>
                  <Text className={styles.roomName}>{r.name}</Text>
                  <View className={styles.roomTheme}>🎨 {r.theme}主题</View>
                </View>
                <Text className={styles.roomCapacity}>可容 {r.capacity} 人</Text>
              </View>
              <View className={styles.slotGrid}>
                {r.availableSlots.map(slot => (
                  <View
                    key={slot.id}
                    className={classnames(
                      styles.slotItem,
                      slot.available ? styles.slotAvailable : styles.slotBooked
                    )}
                    onClick={() => handleToggleSlot(r.id, slot.id)}
                  >
                    {slot.startTime.slice(0, 5)}
                    {!slot.available && <Text style={{ display: 'block', fontSize: 18 }}>已约</Text>}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={{ height: 32 }} />
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📢 门店通知模板</Text>
          </View>
          <View className={styles.noticeSettings}>
            <View className={styles.noticeGroup}>
              <Text className={styles.noticeLabel}>💰 定金规则</Text>
              <Textarea
                className={styles.noticeTextarea}
                value={storeNotice.depositRule}
                disabled
                autoHeight
                maxlength={200}
              />
            </View>
            <View className={styles.noticeGroup}>
              <Text className={styles.noticeLabel}>🏠 到店须知</Text>
              <Textarea
                className={styles.noticeTextarea}
                value={storeNotice.arrivalNotice}
                disabled
                autoHeight
                maxlength={200}
              />
            </View>
            <View className={styles.noticeGroup}>
              <Text className={styles.noticeLabel}>⏰ 迟到规则</Text>
              <Textarea
                className={styles.noticeTextarea}
                value={storeNotice.lateRule}
                disabled
                autoHeight
                maxlength={200}
              />
            </View>
          </View>
        </View>
      )}

      {activeTab === 'dms' && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🎙️ DM 排班表</Text>
          </View>

          {dms.map(dm => {
            const canBringScripts = scripts.filter(s => dm.scriptIds.includes(s.id));
            return (
              <View key={dm.id} className={styles.dmItem}>
                <View className={styles.dmAvatar}>
                  <Image className={styles.dmAvatarImg} src={dm.avatar} mode="aspectFill" />
                </View>
                <View className={styles.dmBody}>
                  <View className={styles.dmTop}>
                    <Text className={styles.dmName}>DM {dm.name}</Text>
                    <Text className={styles.dmRating}>⭐ {dm.rating}</Text>
                  </View>
                  <View className={styles.dmScripts}>
                    擅长带本：{canBringScripts.map(s => s.name).join('、') || '暂无'}
                  </View>

                  {editingDmId === dm.id ? (
                    <View className={styles.dmScriptEditor}>
                      <Text className={styles.editorLabel}>点击切换可带本：</Text>
                      <View className={styles.scriptCheckList}>
                        {scripts.map(s => {
                          const checked = dm.scriptIds.includes(s.id);
                          return (
                            <View
                              key={s.id}
                              className={classnames(styles.scriptCheckItem, checked && styles.scriptChecked)}
                              onClick={() => handleToggleDmScript(dm.id, s.id, dm.scriptIds)}
                            >
                              <Text className={styles.checkIcon}>{checked ? '✓' : '○'}</Text>
                              <Text className={styles.checkName}>{s.name}</Text>
                            </View>
                          );
                        })}
                      </View>
                      <View className={styles.editorActions}>
                        <View className={styles.saveBtn} onClick={() => { setEditingDmId(null); Taro.showToast({ title: '已保存', icon: 'success' }); }}>完成</View>
                      </View>
                    </View>
                  ) : (
                    <View className={styles.dmSlots}>
                      {['13:00', '14:00', '19:00', '20:00'].map(t => {
                        const isFree = dm.availableSlots.includes(t);
                        return (
                          <View
                            key={t}
                            className={classnames(
                              styles.dmSlotTag,
                              isFree ? styles.dmSlotFree : styles.dmSlotBusy
                            )}
                          >
                            {t.slice(0, 5)} {isFree ? '空' : '约'}
                          </View>
                        );
                      })}
                      <View className={styles.editLink} onClick={() => setEditingDmId(dm.id)}>✏️ 编辑带本</View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {activeTab === 'cars' && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🚗 车局管理</Text>
          </View>

          <View className={styles.filterRow}>
            {[
              { k: 'all', label: '全部' },
              { k: 'almost', label: '即将满车' },
              { k: 'needNotice', label: '待发提醒' },
              { k: 'confirmed', label: '已成车' }
            ].map(f => (
              <View
                key={f.k}
                className={classnames(
                  styles.filterChip,
                  carFilter === f.k && styles.filterChipActive
                )}
                onClick={() => setCarFilter(f.k as CarFilter)}
              >
                {f.label}
              </View>
            ))}
          </View>

          {filteredCars.length === 0 ? (
            <View className={styles.emptyWrap}>
              <View className={styles.emptyIcon}>🚗</View>
              <Text className={styles.emptyText}>暂无符合条件的车局</Text>
            </View>
          ) : (
            filteredCars.map(car => {
              const confirmed = getConfirmedCount(car);
              const remaining = getRemainingCount(car);
              const progress = Math.min(100, (confirmed / car.minPlayers) * 100);
              const isAlmost = car.status === 'almost_full' || (remaining <= 1 && car.status !== 'finished');
              const needSendAll = !car.depositSent || !car.noticeSent;

              return (
                <View
                  key={car.id}
                  className={classnames(styles.carItem, isAlmost && styles.carItemHighlight)}
                >
                  <View className={styles.carTop}>
                    <View>
                      <View style={{ display: 'flex', alignItems: 'center' }}>
                        <Text className={styles.carName}>{car.scriptName}</Text>
                        {isAlmost && (
                          <View className={styles.highlightBadge}>🔥 即将满车</View>
                        )}
                      </View>
                      <View className={styles.carMeta}>
                        {formatDate(car.date)} {car.startTime.slice(0, 5)} · {car.roomName}
                      </View>
                      <View className={styles.carMeta}>
                        🚗 {car.captainName} · 🎙️ DM {car.dmName}
                      </View>
                    </View>
                    <View style={{
                      color: getStatusColor(car.status),
                      fontSize: 24,
                      fontWeight: 500,
                      flexShrink: 0
                    }}>
                      {getStatusText(car.status)}
                    </View>
                  </View>

                  <View className={styles.carProgressRow}>
                    <View className={styles.carProgressBar}>
                      <View
                        className={classnames(
                          styles.carProgressFill,
                          progress >= 100 ? styles.fillDone : (isAlmost ? styles.fillAlmost : styles.fillRecruiting)
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                    <Text className={styles.carProgressText}>
                      {confirmed}/{car.minPlayers}
                      {remaining > 0 && ` · 差${remaining}人`}
                    </Text>
                  </View>

                  <View className={styles.carStatusRow}>
                    <View className={styles.carTags}>
                      <View className={styles.carTag} style={{ background: getStatusColor(car.status) + '22', color: getStatusColor(car.status) }}>
                        #{car.id.slice(-4).toUpperCase()}
                      </View>
                      <View className={classnames(styles.carTag, styles.tagCaptain)}>
                        车头已确认
                      </View>
                      <View className={classnames(
                        styles.carTag,
                        car.depositSent ? styles.tagDepositSent : styles.tagDepositPending
                      )}>
                        {car.depositSent ? '✓ 定金已提醒' : '⏳ 待收定金'}
                      </View>
                      <View className={classnames(
                        styles.carTag,
                        car.noticeSent ? styles.tagNoticeSent : styles.tagNoticePending
                      )}>
                        {car.noticeSent ? '✓ 须知已发' : '⏳ 待发须知'}
                      </View>
                    </View>

                    <View className={styles.carActions}>
                      <View
                        className={classnames(styles.carBtn, styles.btnView)}
                        onClick={() => handleViewCar(car.id)}
                      >
                        查看详情
                      </View>
                      {needSendAll && car.status !== 'finished' && car.status !== 'cancelled' && (
                        <View
                          className={classnames(styles.carBtn, styles.btnQuick)}
                          onClick={() => handleSendAllForCar(car.id)}
                        >
                          🎯 一键提醒
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default AdminPage;
