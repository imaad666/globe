import type { FC } from 'react';

/**
 * Player avatar marker with a pulsing radar effect to visualize
 * the interaction radius (conceptually ~30m).
 *
 * This component is purely visual; positioning is handled by the Mapbox Marker.
 */
export const PlayerMarker: FC = () => {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      {/* Radar ring */}
      <div className="pointer-events-none absolute inset-0 rounded-full border border-monad-purple/30 bg-monad-purple/10 blur-[1px] animate-radar-ping" />

      {/* Inner glow ring */}
      <div className="pointer-events-none absolute h-11 w-11 rounded-full bg-monad-purple/20 shadow-neon-soft" />

      {/* Core avatar chip */}
      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-monad-purple via-monad-neon to-monad-purple text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-neon-soft animate-avatar-pulse">
        <span className="drop-shadow-neon-text">You</span>
      </div>

      {/* Directional indicator / heading pointer (purely cosmetic for now) */}
      <div className="pointer-events-none absolute -top-1 left-1/2 h-4 w-1 -translate-x-1/2 rounded-full bg-monad-neon/90 blur-[0.5px]" />
    </div>
  );
};

export default PlayerMarker;


