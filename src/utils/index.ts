import { Car, Player, CarStatus, ScriptGenderRequirement, StoreNotice } from '@/types';
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

export const getDepositCount = (car: Car): { paid: number; total: number; unpaid: Player[] } => {
  const confirmed = car.players.filter(p => p.confirmed);
  const paid = confirmed.filter(p => p.depositPaid).length;
  const unpaid = confirmed.filter(p => !p.depositPaid);
  return { paid, total: confirmed.length, unpaid };
};

export const generateInvitationText = (
  car: Car,
  notice: StoreNotice,
  isLocked: boolean
): string => {
  const confirmedPlayers = car.players.filter(p => p.confirmed);
  const { paid, total } = getDepositCount(car);

  if (isLocked) {
    const playerList = confirmedPlayers
      .map((p, i) => `${i + 1}. ${p.name}（${p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '不限'}）${p.depositPaid ? '✓已付定金' : '⏳待付定金'}`)
      .join('\n');

    return `【${car.scriptName}】🔒 车局已锁定！
━━━━━━━━━━━━━━
📅 时间：${formatDate(car.date)} ${car.startTime.slice(0, 5)} - ${car.endTime.slice(0, 5)}
🏠 房间：${car.roomName}
🎙️ DM：${car.dmName}
🚗 车头：${car.captainName}
👥 人数：${total}/${car.minPlayers}人（已锁定）
💰 定金：¥${car.depositAmount}/人 · 已付 ${paid}/${total} 人
━━━━━━━━━━━━━━
📋 最终名单：
${playerList}
━━━━━━━━━━━━━━
📌 重要提醒：
${notice.arrivalNotice}
${notice.lateRule}
${notice.depositRule}
━━━━━━━━━━━━━━
${car.acceptStrangers ? '👉 已开启熟客补位，差人时店员会帮忙匹配靠谱玩家' : '👉 纯熟人局，拒绝空降，婉拒鸽子🕊️'}`;
  }

  return `🚗 ${car.captainName} 邀你打本啦！
【${car.scriptName}】
━━━━━━━━━━━━━━
📅 时间：${formatDate(car.date)} ${car.startTime.slice(0, 5)} - ${car.endTime.slice(0, 5)}
🏠 房间：${car.roomName}
🎙️ DM：${car.dmName}
👥 人数：${confirmedPlayers.length}/${car.minPlayers}人（${car.genderRequirement.male}男${car.genderRequirement.female}女${car.genderRequirement.flexible > 0 ? `+${car.genderRequirement.flexible}不限` : ''}）
💰 人均：¥${car.price} · 定金¥${car.depositAmount}
━━━━━━━━━━━━━━
📝 剧本介绍：
${car.scriptName} 是${car.acceptStrangers ? '' : '纯'}熟人私密局${car.acceptStrangers ? '，接受店员匹配熟客补位' : '，拒绝空降'}。
💡 当前还差 ${getRemainingCount(car)} 人成车，赶紧确认上车！
━━━━━━━━━━━━━━
⚠️ ${notice.depositRule}`;
};
