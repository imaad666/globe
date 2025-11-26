import { useEffect, useMemo, useState } from 'react';
import Map, { MapRef, Marker, ViewState } from 'react-map-gl';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useGameStore } from '../../store/gameStore';
import PlayerMarker from './PlayerMarker';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const INITIAL_VIEW: ViewState = {
  latitude: 37.7749,
  longitude: -122.4194,
  zoom: 16,
};

export const GameMap = () => {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW);
  const { smoothedLocation, loot, permissionStatus } = useGameStore(
    (state) => ({
      smoothedLocation: state.smoothedLocation,
      loot: state.loot,
      permissionStatus: state.permissionStatus,
    })
  );

  const mapRef = useState<MapRef | null>(null)[0];

  // Start geolocation + smoothing loop.
  useGeolocation();

  // When we first get a smoothed location, center the camera on the player.
  useEffect(() => {
    if (!smoothedLocation) return;
    setViewState((prev) => ({
      ...prev,
      latitude: smoothedLocation.lat,
      longitude: smoothedLocation.lng,
    }));
  }, [smoothedLocation]);

  const lootMarkers = useMemo(
    () =>
      loot
        .filter((l) => !l.collected)
        .map((item) => (
          <Marker
            key={item.id}
            longitude={item.lng}
            latitude={item.lat}
            anchor="center"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-monad-purple/40 bg-monad-dark/80 text-[10px] font-semibold uppercase tracking-[0.12em] text-monad-purple shadow-neon-soft backdrop-blur-md">
              M
            </div>
          </Marker>
        )),
    [loot]
  );

  const showPermissionOverlay =
    permissionStatus === 'denied' || permissionStatus === 'unsupported';

  return (
    <div className="relative h-full w-full bg-monad-dark text-white">
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-monad-dark text-center text-sm text-red-400">
          <div>
            <p className="font-semibold">
              Missing <code>VITE_MAPBOX_TOKEN</code>.
            </p>
            <p className="mt-1 opacity-80">
              Add your Mapbox access token to a <code>.env</code> file to see
              the map.
            </p>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        doubleClickZoom
        scrollZoom
        touchZoomRotate
      >
        {smoothedLocation && (
          <Marker
            longitude={smoothedLocation.lng}
            latitude={smoothedLocation.lat}
            anchor="center"
          >
            <PlayerMarker />
          </Marker>
        )}

        {lootMarkers}
      </Map>

      {/* Permission / onboarding overlay */}
      {showPermissionOverlay && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4">
          <div className="pointer-events-auto rounded-2xl border border-monad-purple/30 bg-gradient-to-br from-black/80 via-monad-dark/95 to-monad-dark/95 p-4 shadow-neon-soft backdrop-blur-md">
            <h2 className="text-sm font-semibold tracking-wide text-monad-purple">
              Enable GPS to Start Hunting
            </h2>
            <p className="mt-1 text-xs text-gray-300/90">
              We need your location to drop Monad loot around you. Check your
              browser or system settings and allow location access for this
              site.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameMap;


