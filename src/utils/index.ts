import { Car, Player, CarStatus, ScriptGenderRequirement } from '@/types';
import dayjs from 'dayjs';

export const formatDate = (date: string): string => {
  const d = dayjs(date);
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  if (date === today) return '今天';
  if (date === tomorrow) return '明天';
  return `${d.month() + 1}月${d.date()}日 ${d.day() === 0 ? '周日' : '周' + '一二三四五六'[d.day() - 1]}`;
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
};

export const formatDifficulty = (level: number): string => {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
};

export const getStatusText = (status: CarStatus, finalConfirmed?: boolean): string => {
  if (finalConfirmed && status === 'confirmed') return '已锁定';
  const map: Record<CarStatus, string> = {
    recruiting: '招募中',
    almost_full: '即将满车',
    confirmed: '已成车',
    playing: '进行中',
    finished: '已结束',
    cancelled: '已取消'
  };
  return map[status];
};

export const getStatusColor = (status: CarStatus): string => {
  const map: Record<CarStatus, string> = {
    recruiting: '#FF7D54',
    almost_full: '#FF7D00',
    confirmed: '#00B42A',
    playing: '#7B4BFF',
    finished: '#86909C',
    cancelled: '#C9CDD4'
  };
  return map[status];
};

export const getConfirmedCount = (car: Car): number => {
  return car.players.filter(p => p.confirmed).length;
};

export const getRemainingCount = (car: Car): number => {
  const confirmed = getConfirmedCount(car);
  return Math.max(0, car.minPlayers - confirmed);
};

export const getGenderCount = (players: Player[]): { male: number; female: number; unknown: number } => {
  let male = 0, female = 0, unknown = 0;
  players.filter(p => p.confirmed).forEach(p => {
    if (p.gender === 'male') male++;
    else if (p.gender === 'female') female++;
    else unknown++;
  });
  return { male, female, unknown };
};

export const getGenderTip = (req: ScriptGenderRequirement, players: Player[]): string => {
  const { male, female } = getGenderCount(players);
  const tips: string[] = [];

  if (req.male > 0 || req.female > 0) {
    const base: string[] = [];
    if (req.male > 0) base.push(`${req.male}男`);
    if (req.female > 0) base.push(`${req.female}女`);
    if (req.flexible > 0) base.push(`${req.flexible}不限`);
    tips.push(`该本建议 ${base.join('·')} 更合适`);
  }

  if (req.male > 0 && male < req.male) {
    tips.push(`还缺 ${req.male - male} 位男生`);
  }
  if (req.female > 0 && female < req.female) {
    tips.push(`还缺 ${req.female - female} 位女生`);
  }

  return tips.join('，');
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

export const calcDepositTotal = (car: Car): number => {
  return getConfirmedCount(car) * car.depositAmount;
};
