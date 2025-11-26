import { create } from 'zustand';

export type Location = {
  latitude: number;
  longitude: number;
};

export type Loot = {
  id: string;
  latitude: number;
  longitude: number;
  collected: boolean;
};

export type PermissionStatus = 'idle' | 'granted' | 'denied' | 'unsupported';

type GameState = {
  /** Last raw GPS position from the device. */
  location: Location | null;
  /**
   * Smoothed location used for rendering the avatar.
   * This gets lerped towards the raw GPS location to avoid jitter.
   */
  smoothedLocation: Location | null;
  permissionStatus: PermissionStatus;
  loot: Loot[];
  hasGeneratedInitialLoot: boolean;

  setLocation: (location: Location) => void;
  setSmoothedLocation: (location: Location) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  generateInitialLoot: (origin: Location, count?: number) => void;
  setLootCollected: (lootId: string) => void;
};

/**
 * Generate a random loot position within ~0.005 degrees of the origin.
 * This is a simple bounding box jitter – good enough for a city-scale game.
 */
function randomLootPosition(origin: Location, delta = 0.005): Location {
  const dLat = (Math.random() * 2 - 1) * delta;
  const dLng = (Math.random() * 2 - 1) * delta;
  return {
    latitude: origin.latitude + dLat,
    longitude: origin.longitude + dLng,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  location: null,
  smoothedLocation: null,
  permissionStatus: 'idle',
  loot: [],
  hasGeneratedInitialLoot: false,

  setLocation: (location) => set({ location }),

  setSmoothedLocation: (location) => set({ smoothedLocation: location }),

  setPermissionStatus: (status) => set({ permissionStatus: status }),

  generateInitialLoot: (origin, count = 5) => {
    const state = get();
    if (state.hasGeneratedInitialLoot) return;

    const loot: Loot[] = Array.from({ length: count }).map((_, i) => {
      const p = randomLootPosition(origin, 0.005);
      return {
        id: `loot-${i}-${Date.now()}`,
        latitude: p.latitude,
        longitude: p.longitude,
        collected: false,
      };
    });

    set({
      loot,
      hasGeneratedInitialLoot: true,
    });
  },

  setLootCollected: (lootId) =>
    set((state) => ({
      loot: state.loot.map((l) =>
        l.id === lootId ? { ...l, collected: true } : l
      ),
    })),
}));


