import { Room, TimeSlot } from '@/types';
import dayjs from 'dayjs';

const generateTimeSlots = (roomId: string, days: number = 7): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const sessions = [
    { start: '13:00', end: '18:00' },
    { start: '19:00', end: '24:00' }
  ];

  for (let d = 0; d < days; d++) {
    const date = dayjs().add(d, 'day').format('YYYY-MM-DD');
    for (let s = 0; s < sessions.length; s++) {
      slots.push({
        id: `${roomId}-${d}-${s}`,
        date,
        startTime: sessions[s].start,
        endTime: sessions[s].end,
        available: Math.random() > 0.3
      });
    }
  }
  return slots;
};

export const mockRooms: Room[] = [
  {
    id: 'r001',
    name: '迷雾阁',
    capacity: 10,
    theme: '推理本专用·英伦风',
    availableSlots: generateTimeSlots('r001')
  },
  {
    id: 'r002',
    name: '桃花庵',
    capacity: 8,
    theme: '古风情感·中式庭院',
    availableSlots: generateTimeSlots('r002')
  },
  {
    id: 'r003',
    name: '惊魂夜',
    capacity: 8,
    theme: '恐怖本·鬼屋氛围',
    availableSlots: generateTimeSlots('r003')
  },
  {
    id: 'r004',
    name: '百乐门',
    capacity: 12,
    theme: '民国风·大上海',
    availableSlots: generateTimeSlots('r004')
  },
  {
    id: 'r005',
    name: '星辰间',
    capacity: 6,
    theme: '科幻赛博·小型包间',
    availableSlots: generateTimeSlots('r005')
  }
];
