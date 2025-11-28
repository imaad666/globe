'use client';

import { Map, Marker } from '@vis.gl/react-google-maps';
import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { spawnLoot, claimLoot, getActiveLoot } from '@/actions/game';

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

// Purple circle SVG icon for loot
const lootIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#836EF9" stroke="white" stroke-width="2"/>
  <text x="12" y="16" font-size="12" font-weight="bold" fill="white" text-anchor="middle">M</text>
</svg>
`)}`;

// Player avatar icon
const playerIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#836EF9" stroke="white" stroke-width="2"/>
  <circle cx="16" cy="16" r="10" fill="#836EF9" opacity="0.8"/>
</svg>
`)}`;

export default function GameMap() {
  const { address, isConnected } = useAccount();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hasSpawned, setHasSpawned] = useState(false);
  const [hasCentered, setHasCentered] = useState(false);

  // Fetch active loot (disabled if no DB)
  const { data: lootData, refetch } = useQuery({
    queryKey: ['activeLoot'],
    queryFn: async () => {
      const result = await getActiveLoot();
      return result.loot || [];
    },
    enabled: false, // Disable DB queries for now
    refetchInterval: false,
  });

  // Get user location immediately on load
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.log('Geolocation not supported');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    };

    // Request location immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      options
    );

    // Then watch for updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Spawn loot when location is first available (disabled for now)
  // useEffect(() => {
  //   if (userLocation && !hasSpawned && isConnected) {
  //     spawnLoot(userLocation.lat, userLocation.lng).then(() => {
  //       setHasSpawned(true);
  //       refetch();
  //     });
  //   }
  // }, [userLocation, hasSpawned, isConnected, refetch]);

  // Center map on user location when it first becomes available
  useEffect(() => {
    if (map && userLocation && !hasCentered) {
      // Center once when location is first received, then let user interact freely
      map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(16);
      setHasCentered(true);
    }
  }, [map, userLocation, hasCentered]);

  // Handle loot claim
  const handleLootClick = useCallback(
    async (lootId: string) => {
      if (!address || !isConnected) {
        alert('Please connect your wallet first');
        return;
      }

      const result = await claimLoot(lootId, address);
      if (result.success) {
        alert(`Loot claimed! Score: ${result.score}`);
        refetch();
      } else {
        alert(result.error || 'Failed to claim loot');
      }
    },
    [address, isConnected, refetch]
  );

  // Use defaultCenter - update when location is available
  const mapCenter = userLocation || { lat: 12.9716, lng: 77.5946 };

  return (
    <Map
      key={userLocation ? `${userLocation.lat}-${userLocation.lng}` : 'default'}
      style={{ width: '100vw', height: '100vh' }}
      defaultCenter={mapCenter}
      defaultZoom={userLocation ? 16 : 15}
      disableDefaultUI={true}
      styles={mapStyles}
      onLoad={(mapInstance) => {
        setMap(mapInstance);
        // Always center on user location when map loads (if available)
        if (userLocation) {
          mapInstance.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
          mapInstance.setZoom(16);
          if (!hasCentered) {
            setHasCentered(true);
          }
        }
      }}
    >
      {/* Player marker */}
      {userLocation && (
        <Marker position={userLocation} icon={playerIcon} />
      )}

      {/* Loot markers */}
      {lootData?.map((loot: any) => (
        <Marker
          key={loot._id.toString()}
          position={{ lat: loot.lat, lng: loot.lng }}
          icon={lootIcon}
          onClick={() => handleLootClick(loot._id.toString())}
        />
      ))}
    </Map>
  );
}

