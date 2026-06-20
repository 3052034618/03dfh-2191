export type Gender = 'male' | 'female' | 'unknown';

export type ScriptType = '硬核推理' | '情感沉浸' | '恐怖惊悚' | '欢乐机制' | '阵营对抗' | '还原本';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type CarStatus = 'recruiting' | 'almost_full' | 'confirmed' | 'playing' | 'finished' | 'cancelled';

export type UserRole = 'customer' | 'captain' | 'staff' | 'owner';

export type ArrivalStatus = 'not_reminded' | 'reminded' | 'confirmed' | 'arrived';

export interface ScriptGenderRequirement {
  male: number;
  female: number;
  flexible: number;
}

export interface Script {
  id: string;
  name: string;
  cover: string;
  type: ScriptType;
  difficulty: DifficultyLevel;
  duration: number;
  minPlayers: number;
  maxPlayers: number;
  genderRequirement: ScriptGenderRequirement;
  description: string;
  tags: string[];
  price: number;
  inStock: boolean;
  dmIds: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  theme: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DM {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  scriptIds: string[];
  availableSlots: string[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  gender: Gender;
  confirmed: boolean;
  acceptStrangers: boolean;
  role?: string;
  depositPaid?: boolean;
  depositAmount?: number;
  depositPaidAt?: string;
  depositRemindedAt?: string;
  arrivalStatus?: ArrivalStatus;
  arrivalRemindedAt?: string;
  arrivedAt?: string;
}

export interface Car {
  id: string;
  scriptId: string;
  scriptName: string;
  scriptCover: string;
  roomId: string;
  roomName: string;
  dmId: string;
  dmName: string;
  date: string;
  startTime: string;
  endTime: string;
  captainId: string;
  captainName: string;
  captainAvatar: string;
  players: Player[];
  minPlayers: number;
  maxPlayers: number;
  genderRequirement: ScriptGenderRequirement;
  status: CarStatus;
  depositSent: boolean;
  noticeSent: boolean;
  finalConfirmed: boolean;
  acceptStrangers: boolean;
  createdAt: string;
  price: number;
  depositAmount: number;
  depositSentAt?: string;
  noticeSentAt?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  gender: Gender;
  phone: string;
  role: UserRole;
  isRegular: boolean;
  totalPlays: number;
  storeId?: string;
}

export interface StoreNotice {
  depositRule: string;
  arrivalNotice: string;
  lateRule: string;
}

export interface ScheduleConflict {
  type: 'room' | 'dm';
  resourceId: string;
  resourceName: string;
  date: string;
  startTime: string;
  carIds: string[];
}
