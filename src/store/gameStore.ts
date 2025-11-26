import { create } from 'zustand';

export type LatLng = {
  lat: number;
  lng: number;
  accuracy?: number | null;
};

export type Loot = {
  id: string;
  lat: number;
  lng: number;
  collected: boolean;
};

export type PermissionStatus = 'idle' | 'granted' | 'denied' | 'unsupported';

type GameState = {
  /** Last raw GPS position from the device. */
  userLocation: LatLng | null;
  /**
   * Smoothed location used for rendering the avatar.
   * This gets lerped towards the raw GPS location to avoid jitter.
   */
  smoothedLocation: LatLng | null;
  permissionStatus: PermissionStatus;
  loot: Loot[];
  hasGeneratedInitialLoot: boolean;

  setUserLocation: (location: LatLng) => void;
  setSmoothedLocation: (location: LatLng) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  generateInitialLoot: (origin: LatLng, count?: number) => void;
  setLootCollected: (lootId: string) => void;
};

/**
 * Returns a random point within a given radius (in meters) around an origin.
 * Uses a simple equirectangular approximation, more than good enough at < 1km scale.
 */
function randomPointAround(origin: LatLng, radiusMeters: number): LatLng {
  const r = radiusMeters * Math.sqrt(Math.random()); // bias towards center
  const theta = Math.random() * 2 * Math.PI;

  const dx = (r * Math.cos(theta)) / 111_111; // meters -> degrees latitude
  const dy =
    (r * Math.sin(theta)) /
    (111_111 * Math.cos((origin.lat * Math.PI) / 180)); // meters -> degrees longitude

  return {
    lat: origin.lat + dx,
    lng: origin.lng + dy,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  userLocation: null,
  smoothedLocation: null,
  permissionStatus: 'idle',
  loot: [],
  hasGeneratedInitialLoot: false,

  setUserLocation: (location) => set({ userLocation: location }),

  setSmoothedLocation: (location) => set({ smoothedLocation: location }),

  setPermissionStatus: (status) => set({ permissionStatus: status }),

  generateInitialLoot: (origin, count = 7) => {
    const state = get();
    if (state.hasGeneratedInitialLoot) return;

    const radiusMeters = 500; // within 500m of the player's initial location
    const loot: Loot[] = Array.from({ length: count }).map((_, i) => {
      const p = randomPointAround(origin, radiusMeters);
      return {
        id: `loot-${i}-${Date.now()}`,
        lat: p.lat,
        lng: p.lng,
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


