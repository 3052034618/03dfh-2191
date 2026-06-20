import { create } from 'zustand';
import { User, Car, Script, Room, DM, StoreNotice, Gender } from '@/types';
import { mockScripts } from '@/data/scripts';
import { mockRooms } from '@/data/rooms';
import { mockDMs } from '@/data/dms';
import { mockCars } from '@/data/cars';

interface AppState {
  currentUser: User;
  users: User[];
  scripts: Script[];
  rooms: Room[];
  dms: DM[];
  cars: Car[];
  storeNotice: StoreNotice;
  preselectedScriptId: string | null;
  setCurrentUser: (user: User) => void;
  setPreselectedScriptId: (id: string | null) => void;
  addCar: (car: Car) => void;
  updateCar: (carId: string, data: Partial<Car>) => void;
  updatePlayer: (carId: string, playerId: string, data: Partial<Car['players'][0]>) => void;
  sendDepositReminder: (carId: string, playerId?: string) => void;
  sendNotice: (carId: string) => void;
  confirmFinalList: (carId: string) => void;
  joinCar: (carId: string, player: Car['players'][0]) => void;
  updateScript: (scriptId: string, data: Partial<Script>) => void;
  updateRoom: (roomId: string, data: Partial<Room>) => void;
  updateDM: (dmId: string, data: Partial<DM>) => void;
  toggleSlot: (roomId: string, slotId: string) => void;
  togglePlayerDeposit: (carId: string, playerId: string, paid: boolean) => void;
}

const mockUsers: User[] = [
  { id: 'u001', name: '阿伟', avatar: 'https://picsum.photos/id/1005/200/200', gender: 'male', phone: '138****8888', role: 'captain', isRegular: true, totalPlays: 36, storeId: 'st001' },
  { id: 'u002', name: '小美', avatar: 'https://picsum.photos/id/1011/200/200', gender: 'female', phone: '139****6666', role: 'captain', isRegular: true, totalPlays: 28, storeId: 'st001' },
  { id: 'u_staff', name: '小颖（店员）', avatar: 'https://picsum.photos/id/1027/200/200', gender: 'female', phone: '136****9999', role: 'staff', isRegular: true, totalPlays: 0, storeId: 'st001' }
];

const defaultNotice: StoreNotice = {
  depositRule: '定金50元/人，成车后24小时内未支付视为自动放弃，定金不退。',
  arrivalNotice: '请提前15分钟到店，到店后请报车头名字签到。店内提供免费柠檬水和小零食。',
  lateRule: '迟到15分钟以上将扣除10元/人作为其他玩家的等待补偿，迟到30分钟以上视为自动放弃且定金不退。'
};

export const useStore = create<AppState>((set) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  scripts: mockScripts,
  rooms: mockRooms,
  dms: mockDMs,
  cars: mockCars,
  storeNotice: defaultNotice,
  preselectedScriptId: null,

  setCurrentUser: (user: User) => set({ currentUser: user }),
  setPreselectedScriptId: (id: string | null) => set({ preselectedScriptId: id }),

  addCar: (car: Car) => set((state) => ({
    cars: [car, ...state.cars]
  })),

  updateCar: (carId: string, data: Partial<Car>) => set((state) => ({
    cars: state.cars.map(c => c.id === carId ? { ...c, ...data } : c)
  })),

  updatePlayer: (carId: string, playerId: string, data: Partial<Car['players'][0]>) => set((state) => ({
    cars: state.cars.map(car => {
      if (car.id !== carId) return car;
      return {
        ...car,
        players: car.players.map(p => p.id === playerId ? { ...p, ...data } : p)
      };
    })
  })),

  sendDepositReminder: (carId: string, playerId?: string) => set((state) => ({
    cars: state.cars.map(c => {
      if (c.id !== carId) return c;
      if (playerId) {
        return {
          ...c,
          players: c.players.map(p =>
            p.id === playerId
              ? { ...p, depositPaid: false, depositAmount: c.depositAmount }
              : p
          )
        };
      }
      return {
        ...c,
        depositSent: true,
        players: c.players.map(p => ({
          ...p,
          depositPaid: false,
          depositAmount: c.depositAmount
        }))
      };
    })
  })),

  sendNotice: (carId: string) => set((state) => ({
    cars: state.cars.map(c => c.id === carId ? { ...c, noticeSent: true } : c)
  })),

  confirmFinalList: (carId: string) => set((state) => ({
    cars: state.cars.map(c => c.id === carId ? { ...c, finalConfirmed: true, status: 'confirmed' } : c)
  })),

  togglePlayerDeposit: (carId: string, playerId: string, paid: boolean) => set((state) => ({
    cars: state.cars.map(car => {
      if (car.id !== carId) return car;
      return {
        ...car,
        players: car.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                depositPaid: paid,
                depositPaidAt: paid ? new Date().toISOString() : undefined,
                depositAmount: paid ? car.depositAmount : p.depositAmount
              }
            : p
        )
      };
    })
  })),

  joinCar: (carId: string, player: Car['players'][0]) => set((state) => ({
    cars: state.cars.map(car => {
      if (car.id !== carId) return car;
      const newPlayers = [...car.players, player];
      const confirmedCount = newPlayers.filter(p => p.confirmed).length;
      let newStatus = car.status;
      if (confirmedCount >= car.maxPlayers) newStatus = 'confirmed';
      else if (confirmedCount >= car.minPlayers - 1) newStatus = 'almost_full';
      return { ...car, players: newPlayers, status: newStatus };
    })
  })),

  updateScript: (scriptId: string, data: Partial<Script>) => set((state) => ({
    scripts: state.scripts.map(s => s.id === scriptId ? { ...s, ...data } : s)
  })),

  updateRoom: (roomId: string, data: Partial<Room>) => set((state) => ({
    rooms: state.rooms.map(r => r.id === roomId ? { ...r, ...data } : r)
  })),

  updateDM: (dmId: string, data: Partial<DM>) => set((state) => ({
    dms: state.dms.map(d => d.id === dmId ? { ...d, ...data } : d)
  })),

  toggleSlot: (roomId: string, slotId: string) => set((state) => ({
    rooms: state.rooms.map(r => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        availableSlots: r.availableSlots.map(s =>
          s.id === slotId ? { ...s, available: !s.available } : s
        )
      };
    })
  }))
}));

export const getGenderText = (g: Gender): string => {
  if (g === 'male') return '男';
  if (g === 'female') return '女';
  return '不限';
};
