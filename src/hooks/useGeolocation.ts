import { useEffect, useRef } from 'react';
import { LatLng, useGameStore } from '../store/gameStore';

type WatchOptions = PositionOptions;

const DEFAULT_WATCH_OPTIONS: WatchOptions = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
  timeout: 20_000,
};

const LERP_ALPHA = 0.12; // smoothing factor per frame (0–1)

/**
 * Hook that:
 * - Subscribes to `navigator.geolocation.watchPosition`
 * - Updates raw `userLocation` in the Zustand store
 * - Runs a lightweight lerp loop to update `smoothedLocation` for the avatar
 * - Sets a permission status flag for UI to react to
 */
export function useGeolocation(options: WatchOptions = DEFAULT_WATCH_OPTIONS) {
  const {
    setUserLocation,
    setSmoothedLocation,
    setPermissionStatus,
    generateInitialLoot,
    userLocation,
    hasGeneratedInitialLoot,
  } = useGameStore((state) => ({
    setUserLocation: state.setUserLocation,
    setSmoothedLocation: state.setSmoothedLocation,
    setPermissionStatus: state.setPermissionStatus,
    generateInitialLoot: state.generateInitialLoot,
    userLocation: state.userLocation,
    hasGeneratedInitialLoot: state.hasGeneratedInitialLoot,
  }));

  const targetLocationRef = useRef<LatLng | null>(null);
  const smoothedLocationRef = useRef<LatLng | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Start / stop geolocation watch
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPermissionStatus('unsupported');
      return;
    }

    let isMounted = true;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMounted) return;

        const next: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        };

        setPermissionStatus('granted');
        setUserLocation(next);
        targetLocationRef.current = next;

        // Seed the smoothed position if we don't have one yet.
        if (!smoothedLocationRef.current) {
          smoothedLocationRef.current = next;
          setSmoothedLocation(next);
        }

        // Generate loot once we have a stable initial location.
        if (!hasGeneratedInitialLoot) {
          generateInitialLoot(next);
        }
      },
      (err) => {
        // Permission denied or other errors.
        if (!isMounted) return;
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        }
        // For other errors we keep state as-is but could log if needed.
      },
      options
    );

    return () => {
      isMounted = false;
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [options, setPermissionStatus, setUserLocation, setSmoothedLocation, generateInitialLoot, hasGeneratedInitialLoot]);

  // Simple lerp loop that runs while we have a target location.
  useEffect(() => {
    const step = () => {
      const target = targetLocationRef.current;
      if (!target) {
        rafIdRef.current = requestAnimationFrame(step);
        return;
      }

      const current = smoothedLocationRef.current ?? target;

      const next: LatLng = {
        lat: current.lat + (target.lat - current.lat) * LERP_ALPHA,
        lng: current.lng + (target.lng - current.lng) * LERP_ALPHA,
        accuracy: target.accuracy ?? current.accuracy ?? null,
      };

      // If the movement is extremely tiny, we can skip store update to avoid needless renders.
      const dLat = Math.abs(next.lat - current.lat);
      const dLng = Math.abs(next.lng - current.lng);
      const threshold = 0.000002; // ~0.2m

      smoothedLocationRef.current = next;
      if (dLat > threshold || dLng > threshold) {
        setSmoothedLocation(next);
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [setSmoothedLocation]);

  return {
    userLocation,
  };
}


