import { Car, Player, CarStatus, ScriptGenderRequirement, StoreNotice, ArrivalStatus } from '@/types';
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

export const getArrivalStatusText = (status?: ArrivalStatus): string => {
  const map: Record<ArrivalStatus, string> = {
    not_reminded: '未提醒',
    reminded: '已提醒',
    confirmed: '已确认到店',
    arrived: '已到店'
  };
  return status ? map[status] : '未提醒';
};

export const getArrivalStatusColor = (status?: ArrivalStatus): string => {
  const map: Record<ArrivalStatus, string> = {
    not_reminded: '#86909C',
    reminded: '#FF7D54',
    confirmed: '#00B42A',
    arrived: '#7B4BFF'
  };
  return status ? map[status] : '#86909C';
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

export interface DepositLedger {
  totalPlayers: number;
  totalReceivable: number;
  totalReceived: number;
  totalPending: number;
  paidPlayers: Player[];
  unpaidPlayers: Player[];
}

export const getDepositLedger = (car: Car): DepositLedger => {
  const confirmed = car.players.filter(p => p.confirmed);
  const paidPlayers = confirmed.filter(p => p.depositPaid);
  const unpaidPlayers = confirmed.filter(p => !p.depositPaid);
  const totalPlayers = confirmed.length;
  const totalReceivable = totalPlayers * car.depositAmount;
  const totalReceived = paidPlayers.length * car.depositAmount;
  const totalPending = unpaidPlayers.length * car.depositAmount;
  return { totalPlayers, totalReceivable, totalReceived, totalPending, paidPlayers, unpaidPlayers };
};

export const getDepositCount = (car: Car): { paid: number; total: number; unpaid: Player[] } => {
  const confirmed = car.players.filter(p => p.confirmed);
  const paid = confirmed.filter(p => p.depositPaid).length;
  const unpaid = confirmed.filter(p => !p.depositPaid);
  return { paid, total: confirmed.length, unpaid };
};

export interface ArrivalProgress {
  notReminded: Player[];
  reminded: Player[];
  confirmed: Player[];
  arrived: Player[];
  total: number;
}

export const getArrivalProgress = (car: Car): ArrivalProgress => {
  const confirmed = car.players.filter(p => p.confirmed);
  const notReminded = confirmed.filter(p => !p.arrivalStatus || p.arrivalStatus === 'not_reminded');
  const reminded = confirmed.filter(p => p.arrivalStatus === 'reminded');
  const confirmedList = confirmed.filter(p => p.arrivalStatus === 'confirmed');
  const arrived = confirmed.filter(p => p.arrivalStatus === 'arrived');
  return { notReminded, reminded, confirmed: confirmedList, arrived, total: confirmed.length };
};

export const formatArrivalTime = (date: string, startTime: string): string => {
  const hour = parseInt(startTime.split(':')[0], 10);
  const minute = parseInt(startTime.split(':')[1], 10);
  const arriveMinute = Math.max(0, minute - 15);
  const arriveHour = arriveMinute === minute - 15 ? hour : hour - 1;
  const displayMin = arriveMinute < 10 ? `0${arriveMinute}` : `${arriveMinute}`;
  return `${formatDate(date)} ${arriveHour}:${displayMin}（开场前15分钟）`;
};

export type InvitationAudience = 'all' | 'paid' | 'unpaid';

export const generateInvitationText = (
  car: Car,
  notice: StoreNotice,
  isLocked: boolean,
  audience: InvitationAudience = 'all',
  playerId?: string
): string => {
  const confirmedPlayers = car.players.filter(p => p.confirmed);
  const { paid, total, unpaid } = getDepositCount(car);
  const ledger = getDepositLedger(car);

  if (isLocked) {
    const playerList = confirmedPlayers
      .map((p, i) => `${i + 1}. ${p.name}（${p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '不限'}）${p.depositPaid ? '✓已付定金' : '⏳待付定金'}`)
      .join('\n');

    if (audience === 'unpaid' || (playerId && unpaid.some(p => p.id === playerId))) {
      const target = playerId ? car.players.find(p => p.id === playerId) : null;
      const greeting = target ? `${target.name}，` : '';
      return `💴 ${greeting}定金提醒
【${car.scriptName}】${car.id.slice(-4).toUpperCase()}号车局
━━━━━━━━━━━━━━
📅 时间：${formatDate(car.date)} ${car.startTime.slice(0, 5)} - ${car.endTime.slice(0, 5)}
🏠 房间：${car.roomName}
🎙️ DM：${car.dmName}
🚗 车头：${car.captainName}
💰 待付定金：¥${car.depositAmount}/人
� 车局定金进度：${paid}/${total} 人已付
━━━━━━━━━━━━━━
📋 最终名单（${confirmedPlayers.length}人）：
${playerList}
━━━━━━━━━━━━━━
⚠️ 定金规则：
${notice.depositRule}
━━━━━━━━━━━━━━
请尽快支付定金锁定席位，24小时内未付视为自动放弃哦~`;
    }

    if (audience === 'paid' || (playerId && ledger.paidPlayers.some(p => p.id === playerId))) {
      const target = playerId ? car.players.find(p => p.id === playerId) : null;
      const greeting = target ? `${target.name}，` : '';
      return `🎮 ${greeting}到店提醒
【${car.scriptName}】${car.id.slice(-4).toUpperCase()}号车局 ✅ 已锁定
━━━━━━━━━━━━━━
⏰ 到店时间：${formatArrivalTime(car.date, car.startTime)}
🎬 开场时间：${formatDate(car.date)} ${car.startTime.slice(0, 5)}
🏠 房间：${car.roomName}
🎙️ DM：${car.dmName}
🚗 车头：${car.captainName}
💰 定金：已付 ¥${car.depositAmount}
━━━━━━━━━━━━━━
📋 最终名单：
${playerList}
━━━━━━━━━━━━━━
📌 到店须知：
${notice.arrivalNotice}
${notice.lateRule}
━━━━━━━━━━━━━━
有任何问题随时联系车头或店员，期待和大家一起玩本！🎉`;
    }

    return `【${car.scriptName}】�🔒 车局已锁定！
━━━━━━━━━━━━━━
📅 时间：${formatDate(car.date)} ${car.startTime.slice(0, 5)} - ${car.endTime.slice(0, 5)}
⏰ 到店时间：${formatArrivalTime(car.date, car.startTime)}
🏠 房间：${car.roomName}
🎙️ DM：${car.dmName}
🚗 车头：${car.captainName}
👥 人数：${total}/${car.minPlayers}人（已锁定）
💰 定金：¥${car.depositAmount}/人 · 已付 ${paid}/${total} 人（共¥${ledger.totalReceived}/¥${ledger.totalReceivable}）
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
