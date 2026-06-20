import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import ScriptCard from '@/components/ScriptCard';
import RoomCard from '@/components/RoomCard';
import { Script, Room, TimeSlot, DM, Car } from '@/types';
import { formatDate, generateId, getGenderTip, formatDuration, formatDifficulty } from '@/utils';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

type Step = 1 | 2 | 3 | 4;

const CreatePage: React.FC = () => {
  const { scripts, rooms, dms, currentUser, addCar, preselectedScriptId, setPreselectedScriptId } = useStore();

  const [step, setStep] = useState<Step>(1);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDM, setSelectedDM] = useState<DM | null>(null);
  const [acceptStrangers, setAcceptStrangers] = useState(false);

  useEffect(() => {
    if (preselectedScriptId) {
      const found = scripts.find(s => s.id === preselectedScriptId);
      if (found) {
        setSelectedScript(found);
        setStep(2);
        setPreselectedScriptId(null);
      }
    }
  }, [preselectedScriptId, scripts, setPreselectedScriptId]);

  const availableScripts = useMemo(() => {
    return scripts.filter(s => s.inStock);
  }, [scripts]);

  const availableRooms = useMemo(() => {
    if (!selectedScript) return rooms;
    return rooms
      .filter(r => r.capacity >= selectedScript.minPlayers)
      .map(r => ({
        ...r,
        availableSlots: r.availableSlots.filter(s => s.available)
      }))
      .filter(r => r.availableSlots.length > 0);
  }, [rooms, selectedScript]);

  const availableDMs = useMemo(() => {
    if (!selectedScript || !selectedSlot) return [];
    return dms.filter(dm =>
      dm.scriptIds.includes(selectedScript.id) &&
      (
        dm.availableSlots.includes(selectedSlot.date) ||
        dm.availableSlots.includes(selectedSlot.startTime)
      )
    );
  }, [dms, selectedScript, selectedSlot]);

  const playersPreview = useMemo(() => {
    return [{
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      gender: currentUser.gender,
      confirmed: true,
      acceptStrangers,
      role: '车头'
    }];
  }, [currentUser, acceptStrangers]);

  const genderTip = useMemo(() => {
    if (!selectedScript) return '';
    return getGenderTip(selectedScript.genderRequirement, playersPreview);
  }, [selectedScript, playersPreview]);

  const remainingCount = selectedScript
    ? Math.max(0, selectedScript.minPlayers - 1)
    : 0;

  const canNextStep1 = selectedScript !== null;
  const canNextStep2 = selectedRoom !== null && selectedSlot !== null;
  const canNextStep3 = selectedDM !== null;

  const validations = useMemo(() => {
    const list: { ok: boolean; text: string }[] = [];
    list.push({ ok: !!selectedScript, text: selectedScript ? `✓ 已选剧本「${selectedScript.name}」` : '✗ 请选择剧本' });
    list.push({
      ok: !!selectedRoom && !!selectedSlot,
      text: selectedSlot
        ? `✓ 已选${formatDate(selectedSlot.date)} ${selectedSlot.startTime} · ${selectedRoom?.name}`
        : '✗ 请选择房间和时段'
    });
    list.push({
      ok: !!selectedDM && selectedScript ? selectedDM.scriptIds.includes(selectedScript.id) : false,
      text: selectedDM
        ? (selectedScript && selectedDM.scriptIds.includes(selectedScript.id)
          ? `✓ DM ${selectedDM.name} 可带本`
          : `✗ DM ${selectedDM.name} 不带该剧本，请更换`)
        : '✗ 请选择DM'
    });
    if (selectedSlot) {
      const realSlot = selectedRoom?.availableSlots.find(s => s.id === selectedSlot.id);
      list.push({
        ok: !!realSlot?.available,
        text: realSlot?.available ? '✓ 房间时段仍可用' : '✗ 该时段已被占用，请重新选择'
      });
    }
    return list;
  }, [selectedScript, selectedRoom, selectedSlot, selectedDM]);

  const canSubmit = validations.every(v => v.ok);

  const totalEstimate = selectedScript ? selectedScript.price * selectedScript.minPlayers : 0;
  const depositEstimate = selectedScript ? 50 * selectedScript.minPlayers : 0;

  const goNext = () => {
    if (step === 1 && canNextStep1) setStep(2);
    else if (step === 2 && canNextStep2) setStep(3);
    else if (step === 3 && canNextStep3) setStep(4);
  };

  const goPrev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedScript || !selectedRoom || !selectedSlot || !selectedDM) return;

    const newCar: Car = {
      id: 'c_' + generateId(),
      scriptId: selectedScript.id,
      scriptName: selectedScript.name,
      scriptCover: selectedScript.cover,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      dmId: selectedDM.id,
      dmName: selectedDM.name,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      captainId: currentUser.id,
      captainName: currentUser.name,
      captainAvatar: currentUser.avatar,
      players: playersPreview,
      minPlayers: selectedScript.minPlayers,
      maxPlayers: selectedScript.maxPlayers,
      genderRequirement: selectedScript.genderRequirement,
      status: 'recruiting',
      depositSent: false,
      noticeSent: false,
      finalConfirmed: false,
      acceptStrangers,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      price: selectedScript.price,
      depositAmount: 50
    };

    addCar(newCar);
    Taro.showToast({ title: '车局发起成功', icon: 'success' });
    setTimeout(() => {
      Taro.redirectTo({ url: `/pages/car-detail/index?id=${newCar.id}` });
    }, 1200);
  };

  const StepDot = ({ n }: { n: number }) => {
    const active = step === n;
    const done = step > n;
    return (
      <View className={classnames(styles.stepDot, active && styles.stepActive, done && styles.stepDone)}>
        {done ? '✓' : n}
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.stepBar}>
        <View className={styles.stepItem}>
          <StepDot n={1} />
          <Text className={classnames(styles.stepText, step >= 1 && styles.stepTextActive)}>选剧本</Text>
        </View>
        <View className={classnames(styles.stepLine, step > 1 && styles.stepLineDone)} />
        <View className={styles.stepItem}>
          <StepDot n={2} />
          <Text className={classnames(styles.stepText, step >= 2 && styles.stepTextActive)}>选时段</Text>
        </View>
        <View className={classnames(styles.stepLine, step > 2 && styles.stepLineDone)} />
        <View className={styles.stepItem}>
          <StepDot n={3} />
          <Text className={classnames(styles.stepText, step >= 3 && styles.stepTextActive)}>选DM</Text>
        </View>
        <View className={classnames(styles.stepLine, step > 3 && styles.stepLineDone)} />
        <View className={styles.stepItem}>
          <StepDot n={4} />
          <Text className={classnames(styles.stepText, step >= 4 && styles.stepTextActive)}>确认</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 280rpx)' }}>
        {step === 1 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>🎬 第一步：选择剧本</Text>
            <View
              className={styles.searchInput}
              onClick={() => Taro.showToast({ title: '搜索功能演示', icon: 'none' })}
            >
              🔍 搜索剧本名、标签...
            </View>
            {availableScripts.map(s => (
              <View
                key={s.id}
                className={classnames(
                  styles.scriptSelectWrap,
                  selectedScript?.id === s.id && styles.scriptSelectActive
                )}
                onClick={() => setSelectedScript(selectedScript?.id === s.id ? null : s)}
              >
                <ScriptCard script={s} onClick={() => setSelectedScript(selectedScript?.id === s.id ? null : s)} />
                {selectedScript?.id === s.id && (
                  <View className={styles.selectedCheck}>✓ 已选</View>
                )}
              </View>
            ))}
          </View>
        )}

        {step === 2 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📅 第二步：选择房间和时段</Text>

            <View className={styles.selectedPreview}>
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>已选剧本</Text>
                <Text className={styles.previewValue}>{selectedScript?.name}</Text>
                <Text className={styles.previewChange} onClick={() => setStep(1)}>修改</Text>
              </View>
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>人数要求</Text>
                <Text className={styles.previewValue}>
                  {selectedScript?.minPlayers}-{selectedScript?.maxPlayers}人
                  {selectedScript && ` · 时长${formatDuration(selectedScript.duration)}`}
                </Text>
              </View>
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>难度</Text>
                <Text className={styles.previewValue} style={{ color: '#FF7D54' }}>
                  {selectedScript && formatDifficulty(selectedScript.difficulty)}
                </Text>
              </View>
            </View>

            {availableRooms.map(r => (
              <RoomCard
                key={r.id}
                room={r}
                selected={selectedRoom?.id === r.id}
                selectedSlotId={selectedSlot?.id}
                onSelectRoom={() => setSelectedRoom(r)}
                onSelectSlot={(slot) => { setSelectedRoom(r); setSelectedSlot(slot); }}
                showAllSlots
              />
            ))}
          </View>
        )}

        {step === 3 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>🎙️ 第三步：选择DM（主持人）</Text>

            <View className={styles.selectedPreview}>
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>剧本</Text>
                <Text className={styles.previewValue}>{selectedScript?.name}</Text>
                <Text className={styles.previewChange} onClick={() => setStep(1)}>修改</Text>
              </View>
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>场次</Text>
                <Text className={styles.previewValue}>
                  {selectedSlot && `${formatDate(selectedSlot.date)} ${selectedSlot.startTime}`}
                  <Text style={{ color: '#8686A8', marginLeft: 8 }}>· {selectedRoom?.name}</Text>
                </Text>
                <Text className={styles.previewChange} onClick={() => setStep(2)}>修改</Text>
              </View>
            </View>

            {availableDMs.length === 0 ? (
              <View style={{ padding: '80rpx 0', textAlign: 'center' }}>
                <Text style={{ fontSize: 60 }}>😢</Text>
                <Text style={{ color: '#B0B0C8', display: 'block', marginTop: 24 }}>
                  该时段暂无可用DM，请换个场次试试
                </Text>
              </View>
            ) : (
              availableDMs.map(dm => (
                <View
                  key={dm.id}
                  className={classnames(styles.dmRow, selectedDM?.id === dm.id && styles.dmRowActive)}
                  onClick={() => setSelectedDM(dm)}
                >
                  <Image className={styles.dmAvatar} src={dm.avatar} mode="aspectFill" />
                  <View className={styles.dmInfo}>
                    <Text className={styles.dmName}>DM {dm.name} ⭐ {dm.rating}</Text>
                    <Text className={styles.dmMeta}>
                      带过 {dm.scriptIds.length} 个本 · 熟客推荐
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {step === 4 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>✅ 第四步：完整成车预览</Text>

            <View className={styles.previewCard}>
              <View className={styles.previewHeader}>
                {selectedScript?.cover ? (
                  <Image className={styles.previewCover} src={selectedScript.cover} mode="aspectFill" />
                ) : (
                  <View className={styles.previewCoverPlaceholder}>📖</View>
                )}
                <View className={styles.previewHeaderInfo}>
                  <Text className={styles.previewTitle}>{selectedScript?.name || '请先选择剧本'}</Text>
                  <View className={styles.previewTags}>
                    {selectedScript && (
                      <>
                        <View className={styles.previewTag}>{selectedScript.type}</View>
                        <View className={styles.previewTag}>
                          {selectedScript.minPlayers}-{selectedScript.maxPlayers}人
                        </View>
                      </>
                    )}
                  </View>
                  <Text className={styles.previewPrice}>¥{selectedScript?.price || '--'}/人</Text>
                </View>
              </View>

              <View className={styles.previewInfoList}>
                <View className={styles.previewInfoItem}>
                  <View className={styles.previewInfoIcon}>📅</View>
                  <View className={styles.previewInfoContent}>
                    <Text className={styles.previewInfoLabel}>场次</Text>
                    <Text className={styles.previewInfoValue}>
                      {selectedSlot
                        ? `${formatDate(selectedSlot.date)} ${selectedSlot.startTime} - ${selectedSlot.endTime}`
                        : '待选择'}
                    </Text>
                  </View>
                </View>

                <View className={styles.previewInfoItem}>
                  <View className={styles.previewInfoIcon}>🏠</View>
                  <View className={styles.previewInfoContent}>
                    <Text className={styles.previewInfoLabel}>房间</Text>
                    <Text className={styles.previewInfoValue}>
                      {selectedRoom
                        ? `${selectedRoom.name} · ${selectedRoom.theme}主题（${selectedRoom.capacity}人）`
                        : '待选择'}
                    </Text>
                  </View>
                </View>

                <View className={styles.previewInfoItem}>
                  <View className={styles.previewInfoIcon}>🎙️</View>
                  <View className={styles.previewInfoContent}>
                    <Text className={styles.previewInfoLabel}>DM主持人</Text>
                    <Text className={styles.previewInfoValue}>
                      {selectedDM
                        ? `DM ${selectedDM.name} ⭐ ${selectedDM.rating}`
                        : '待选择'}
                    </Text>
                    {selectedDM && selectedScript && !selectedDM.scriptIds.includes(selectedScript.id) && (
                      <Text className={styles.previewInfoWarning}>⚠️ 该DM不带此剧本</Text>
                    )}
                  </View>
                </View>

                <View className={styles.previewInfoItem}>
                  <View className={styles.previewInfoIcon}>🚗</View>
                  <View className={styles.previewInfoContent}>
                    <Text className={styles.previewInfoLabel}>车头</Text>
                    <Text className={styles.previewInfoValue}>{currentUser.name}（你）</Text>
                  </View>
                </View>

                <View className={styles.previewInfoItem}>
                  <View className={styles.previewInfoIcon}>💰</View>
                  <View className={styles.previewInfoContent}>
                    <Text className={styles.previewInfoLabel}>费用预估</Text>
                    <Text className={styles.previewInfoValue} style={{ color: '#FF7D54', fontWeight: 600 }}>
                      ¥{totalEstimate} / 车局 · 定金 ¥{depositEstimate}（成车后收取）
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.smartTip}>
              <View className={styles.tipTitle}>💡 智能提示</View>
              <View className={styles.tipContent}>
                当前已确认 <Text className={styles.tipHighlight}>1</Text> 人（车头），
                {selectedScript && remainingCount > 0 && (
                  <>还差 <Text className={styles.tipHighlight}>{remainingCount}</Text> 人可成车。</>
                )}
                {selectedScript && remainingCount === 0 && (
                  <>已达成最低开车人数！</>
                )}
                {genderTip && (
                  <View style={{ marginTop: 12 }}>{genderTip}</View>
                )}
              </View>
            </View>

            <View className={styles.validationList}>
              <View className={styles.validationTitle}>📋 发起前校验</View>
              {validations.map((v, i) => (
                <View
                  key={i}
                  className={classnames(
                    styles.validationItem,
                    v.ok ? styles.validationOk : styles.validationFail
                  )}
                >
                  {v.text}
                </View>
              ))}
              {!canSubmit && (
                <View className={styles.validationBlockTip}>
                  ⛔ 以上校验项未全部通过，请返回修改后再提交
                </View>
              )}
            </View>

            <View className={styles.settings}>
              <View className={styles.settingRow}>
                <View>
                  <Text className={styles.settingLabel}>接受拼熟客补位</Text>
                  <View className={styles.settingDesc}>允许店员从熟客库匹配合适玩家</View>
                </View>
                <View
                  className={classnames(styles.switch, acceptStrangers && styles.switchOn)}
                  onClick={() => setAcceptStrangers(!acceptStrangers)}
                />
              </View>
            </View>

            <View className={styles.smartTip} style={{ background: 'rgba(123,75,255,0.1)', borderColor: 'rgba(123,75,255,0.3)' }}>
              <View className={styles.tipTitle} style={{ color: '#9B7DFF' }}>🔒 私密车说明</View>
              <View className={styles.tipContent}>
                此为熟客私密车，只有你邀请的好友能看到完整车局信息。
                店方仅能看到车局状态和人数进度，不会接触你的私域关系。
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View className={styles.footer}>
        {step > 1 && step < 4 && (
          <View className={styles.btn} style={{ padding: '0 48rpx' }} onClick={goPrev}>
            上一步
          </View>
        )}
        {step === 4 ? (
          <>
            <View className={styles.priceSummary}>
              <Text className={styles.totalLabel}>预估车局总价</Text>
              <View className={styles.totalPrice}>
                ¥{totalEstimate} <small>/ 定金¥{depositEstimate}</small>
              </View>
            </View>
            <View
              className={classnames(styles.btn, styles.btnPrimary, !canSubmit && styles.btnDisabled)}
              onClick={handleSubmit}
            >
              确认发起车局
            </View>
          </>
        ) : (
          <>
            <View className={styles.priceSummary}>
              {step === 1 && selectedScript && (
                <>
                  <Text className={styles.totalLabel}>已选剧本</Text>
                  <View className={styles.totalPrice} style={{ fontSize: 28 }}>
                    {selectedScript.name} <small>¥{selectedScript.price}/人</small>
                  </View>
                </>
              )}
              {step === 2 && selectedSlot && (
                <>
                  <Text className={styles.totalLabel}>已选场次</Text>
                  <View className={styles.totalPrice} style={{ fontSize: 28 }}>
                    {formatDate(selectedSlot.date)} {selectedSlot.startTime}
                  </View>
                </>
              )}
              {step === 3 && selectedDM && (
                <>
                  <Text className={styles.totalLabel}>已选DM</Text>
                  <View className={styles.totalPrice} style={{ fontSize: 28 }}>
                    {selectedDM.name} <small>⭐{selectedDM.rating}</small>
                  </View>
                </>
              )}
            </View>
            <View
              className={classnames(
                styles.btn,
                styles.btnPrimary,
                (step === 1 && !canNextStep1) || (step === 2 && !canNextStep2) || (step === 3 && !canNextStep3)
                  ? styles.btnDisabled
                  : ''
              )}
              onClick={goNext}
            >
              下一步
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default CreatePage;
