import { DM } from '@/types';

export const mockDMs: DM[] = [
  {
    id: 'dm001',
    name: '老李',
    avatar: 'https://picsum.photos/id/1005/200/200',
    rating: 4.9,
    scriptIds: ['s001', 's003', 's005', 's008', 's010'],
    availableSlots: ['2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25']
  },
  {
    id: 'dm002',
    name: '小鹿',
    avatar: 'https://picsum.photos/id/1012/200/200',
    rating: 4.8,
    scriptIds: ['s001', 's002', 's006', 's009'],
    availableSlots: ['2026-06-21', '2026-06-22', '2026-06-25', '2026-06-26', '2026-06-27']
  },
  {
    id: 'dm003',
    name: '苏苏',
    avatar: 'https://picsum.photos/id/1027/200/200',
    rating: 4.9,
    scriptIds: ['s002', 's004', 's007', 's009'],
    availableSlots: ['2026-06-21', '2026-06-23', '2026-06-24', '2026-06-26', '2026-06-27']
  },
  {
    id: 'dm004',
    name: '阿川',
    avatar: 'https://picsum.photos/id/1074/200/200',
    rating: 4.7,
    scriptIds: ['s003', 's006', 's008', 's010'],
    availableSlots: ['2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26']
  },
  {
    id: 'dm005',
    name: '果果',
    avatar: 'https://picsum.photos/id/1062/200/200',
    rating: 4.8,
    scriptIds: ['s004', 's005', 's007', 's009'],
    availableSlots: ['2026-06-21', '2026-06-22', '2026-06-24', '2026-06-25', '2026-06-27']
  }
];
