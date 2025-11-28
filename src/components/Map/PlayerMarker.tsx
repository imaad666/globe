import { Marker } from '@vis.gl/react-google-maps';

interface PlayerMarkerProps {
  position: { lat: number; lng: number };
}

// Purple circle SVG icon encoded as data URL
const svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#836EF9" stroke="white" stroke-width="2"/>
  <circle cx="16" cy="16" r="10" fill="#836EF9" opacity="0.8"/>
</svg>
`)}`;

export default function PlayerMarker({ position }: PlayerMarkerProps) {
  return (
    <Marker
      position={position}
      icon={svgIcon}
    />
  );
}

