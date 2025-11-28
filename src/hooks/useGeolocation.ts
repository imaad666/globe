import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGeolocation() {
  const setLocation = useGameStore((state) => state.setLocation);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.log('Geolocation is not supported by this browser.');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location updated:', latitude, longitude);
        setLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Geolocation error:', error.code, error.message);
        if (error.code === error.PERMISSION_DENIED) {
          console.error('Location permission denied. Please enable location access in your browser settings.');
        }
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [setLocation]);
}

