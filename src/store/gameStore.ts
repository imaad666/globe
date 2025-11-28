import { create } from 'zustand';

interface GameState {
  location: { lat: number; lng: number } | null;
  setLocation: (loc: { lat: number; lng: number }) => void;
}

export const useGameStore = create<GameState>((set) => ({
  location: null,
  setLocation: (loc) => set({ location: loc }),
}));


