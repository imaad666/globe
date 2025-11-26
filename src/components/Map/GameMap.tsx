import { useEffect, useMemo, useState } from 'react';
import Map, { MapRef, Marker, ViewState } from 'react-map-gl/maplibre';
// eslint-disable-next-line import/default
import maplibregl from 'maplibre-gl';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useGameStore } from '../../store/gameStore';
import PlayerMarker from './PlayerMarker';

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

  const [mapRef, setMapRef] = useState<MapRef | null>(null);

  // Start geolocation + smoothing loop.
  useGeolocation();

  // When we first get a smoothed location, center the camera on the player.
  useEffect(() => {
    if (!smoothedLocation) return;
    setViewState((prev) => ({
      ...prev,
      latitude: smoothedLocation.latitude,
      longitude: smoothedLocation.longitude,
      zoom: prev.zoom ?? 16,
    }));
  }, [smoothedLocation]);

  const lootMarkers = useMemo(
    () =>
      loot
        .filter((l) => !l.collected)
        .map((item) => (
          <Marker
            key={item.id}
            longitude={item.longitude}
            latitude={item.latitude}
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
      <Map
        ref={(instance) => setMapRef(instance)}
        mapLib={maplibregl}
        initialViewState={viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        scrollZoom
        doubleClickZoom
        touchZoomRotate={false}
      >
        {smoothedLocation && (
          <Marker
            longitude={smoothedLocation.longitude}
            latitude={smoothedLocation.latitude}
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


