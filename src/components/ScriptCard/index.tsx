import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Script } from '@/types';
import { formatDuration, formatDifficulty } from '@/utils';
import styles from './index.module.scss';

interface ScriptCardProps {
  script: Script;
  onClick?: () => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ script, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/script-detail/index?id=${script.id}`
      });
    }
  };

  const genderDesc: string[] = [];
  if (script.genderRequirement.male > 0) genderDesc.push(`${script.genderRequirement.male}男`);
  if (script.genderRequirement.female > 0) genderDesc.push(`${script.genderRequirement.female}女`);
  if (script.genderRequirement.flexible > 0) genderDesc.push(`${script.genderRequirement.flexible}不限`);

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.inner}>
        <View className={styles.coverWrap}>
          <Image className={styles.cover} src={script.cover} mode="aspectFill" />
          <View className={styles.priceTag}>¥{script.price}</View>
        </View>
        <View className={styles.info}>
          <View>
            <View className={styles.header}>
              <Text className={styles.name}>{script.name}</Text>
              <View className={styles.typeTag}>{script.type}</View>
            </View>
            <View className={styles.meta}>
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>人数:</Text>
                <Text>{script.minPlayers}-{script.maxPlayers}人</Text>
              </View>
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>难度:</Text>
                <Text className={styles.stars}>{formatDifficulty(script.difficulty)}</Text>
              </View>
              <View className={styles.metaItem}>
                <Text className={styles.metaLabel}>时长:</Text>
                <Text>{formatDuration(script.duration)}</Text>
              </View>
            </View>
            {genderDesc.length > 0 && (
              <View className={styles.meta}>
                <View className={styles.metaItem}>
                  <Text className={styles.metaLabel}>建议:</Text>
                  <Text style={{ color: '#FF7D54' }}>{genderDesc.join('·')}</Text>
                </View>
              </View>
            )}
            <Text className={styles.desc}>{script.description}</Text>
          </View>
          <View className={styles.tagsRow}>
            {script.tags.slice(0, 3).map((tag, i) => (
              <View key={i} className={styles.tag}>{tag}</View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ScriptCard;
