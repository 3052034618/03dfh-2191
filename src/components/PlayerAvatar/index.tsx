import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import { Player } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

interface PlayerAvatarProps {
  player: Player;
  showName?: boolean;
  size?: 'small' | 'medium';
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, showName = true }) => {
  const wrapCls = classnames(
    styles.avatarWrap,
    !player.confirmed && styles.unconfirmed,
    player.role === '车头' && styles.captain,
    player.confirmed && styles.confirmed
  );

  const avatarCls = classnames(
    styles.avatar,
    player.gender === 'male' && styles.male,
    player.gender === 'female' && styles.female
  );

  return (
    <View className={wrapCls}>
      <View className={avatarCls}>
        <Image className={styles.avatarImg} src={player.avatar} mode="aspectFill" />
      </View>
      {showName && <Text className={styles.name}>{player.role || player.name}</Text>}
    </View>
  );
};

export default PlayerAvatar;
