import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useStore } from '@/store/useStore';
import { formatDuration, formatDifficulty } from '@/utils';
import styles from './index.module.scss';

const ScriptDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id;
  const { scripts, dms } = useStore();

  const script = useMemo(() => scripts.find(s => s.id === id), [scripts, id]);
  const availableDMs = useMemo(() => {
    if (!script) return [];
    return dms.filter(dm => dm.scriptIds.includes(script.id));
  }, [dms, script]);

  if (!script) {
    return (
      <View className={styles.page} style={{ padding: 100, textAlign: 'center', color: '#B0B0C8' }}>
        剧本不存在
      </View>
    );
  }

  const goCreate = () => {
    Taro.showToast({ title: '将自动带入剧本信息', icon: 'none' });
    setTimeout(() => Taro.switchTab({ url: '/pages/create/index' }), 800);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.cover}>
        <Image className={styles.coverImg} src={script.cover} mode="aspectFill" />
        <View className={styles.coverMask} />
      </View>

      <View className={styles.content}>
        <View className={styles.headerCard}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{script.name}</Text>
            <Text className={styles.price}>¥{script.price}</Text>
          </View>

          <View className={styles.typeTags}>
            <View className={styles.typeTag}>{script.type}</View>
            {script.tags.slice(0, 3).map((t, i) => (
              <View key={i} className={styles.typeTag} style={{ background: 'rgba(255,125,84,0.12)', color: '#FF7D54' }}>
                {t}
              </View>
            ))}
          </View>

          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>人数</Text>
              <Text className={styles.infoValue}>{script.minPlayers}-{script.maxPlayers}人</Text>
              <View className={styles.genderBox}>
                {script.genderRequirement.male > 0 && (
                  <View className={`${styles.genderChip} ${styles.maleChip}`}>
                    ♂ {script.genderRequirement.male}
                  </View>
                )}
                {script.genderRequirement.female > 0 && (
                  <View className={`${styles.genderChip} ${styles.femaleChip}`}>
                    ♀ {script.genderRequirement.female}
                  </View>
                )}
                {script.genderRequirement.flexible > 0 && (
                  <View className={`${styles.genderChip} ${styles.flexChip}`}>
                    不限 {script.genderRequirement.flexible}
                  </View>
                )}
              </View>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>时长</Text>
              <Text className={styles.infoValue}>{formatDuration(script.duration)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>难度</Text>
              <Text className={styles.stars}>{formatDifficulty(script.difficulty)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>库存</Text>
              <Text className={styles.infoValue} style={{ color: script.inStock ? '#00B42A' : '#F53F3F' }}>
                {script.inStock ? '✓ 可约' : '暂不可约'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📝 剧本简介</Text>
          <Text className={styles.sectionContent}>{script.description}</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>🏷️ 剧本标签</Text>
          <View className={styles.tagList}>
            {script.tags.map((t, i) => (
              <View key={i} className={styles.tag}>{t}</View>
            ))}
          </View>
        </View>

        {availableDMs.length > 0 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>🎙️ 可带本 DM（{availableDMs.length}位）</Text>
            <View className={styles.dmList}>
              {availableDMs.map(dm => (
                <View key={dm.id} className={styles.dmItem}>
                  <Image className={styles.dmAvatar} src={dm.avatar} mode="aspectFill" />
                  <View className={styles.dmInfo}>
                    <Text className={styles.dmName}>DM {dm.name}</Text>
                    <Text className={styles.dmRating}>⭐ 评分 {dm.rating} · 熟客推荐</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className={styles.footer}>
        <View className={`${styles.btn} ${styles.btnOutline}`}>收藏剧本</View>
        <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={goCreate}>
          用这个本发起车局
        </View>
      </View>
    </ScrollView>
  );
};

export default ScriptDetailPage;
