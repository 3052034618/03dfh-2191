import React from 'react';
import { View, Text } from '@tarojs/components';
import { Room, TimeSlot } from '@/types';
import { formatDate } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

interface RoomCardProps {
  room: Room;
  selected?: boolean;
  selectedSlotId?: string;
  onSelectRoom?: () => void;
  onSelectSlot?: (slot: TimeSlot) => void;
  showAllSlots?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  selected = false,
  selectedSlotId,
  onSelectRoom,
  onSelectSlot,
  showAllSlots = false
}) => {
  const displaySlots = showAllSlots
    ? room.availableSlots
    : room.availableSlots.filter(s => s.available).slice(0, 6);

  return (
    <View
      className={classnames(styles.card, selected && styles.selected)}
      onClick={onSelectRoom}
    >
      <View className={styles.header}>
        <Text className={styles.name}>{room.name}</Text>
        <View className={styles.capacityBadge}>可容 {room.capacity} 人</View>
      </View>
      <Text className={styles.theme}>{room.theme}</Text>

      <Text className={styles.slotsTitle}>可选时段</Text>
      <View className={styles.slotsWrap}>
        {displaySlots.map(slot => {
          const cls = classnames(
            styles.slotItem,
            slot.available && styles.slotAvailable,
            selectedSlotId === slot.id && styles.slotSelected,
            !slot.available && styles.slotDisabled
          );
          return (
            <View
              key={slot.id}
              className={cls}
              onClick={(e) => {
                e.stopPropagation();
                if (slot.available && onSelectSlot) onSelectSlot(slot);
              }}
            >
              <Text className={styles.dateLabel}>{formatDate(slot.date)}</Text>
              <Text>{slot.startTime}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default RoomCard;
