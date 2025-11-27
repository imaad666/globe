import { Map } from '@vis.gl/react-google-maps';
import { useState } from 'react';

const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

export default function GameMap() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#242f3e', 
        color: '#d59563',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '16px' }}>Google Maps API Error</h2>
        <p style={{ marginBottom: '8px', color: '#ff6b6b' }}>{error}</p>
        <div style={{ marginTop: '16px', fontSize: '14px', opacity: 0.9, maxWidth: '600px' }}>
          <p style={{ marginBottom: '12px', fontWeight: 'bold' }}>To fix this error:</p>
          <ol style={{ textAlign: 'left', marginTop: '8px', lineHeight: '1.8' }}>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#d59563' }}>Google Cloud Console</a></li>
            <li>Select your project</li>
            <li>Go to <strong>APIs & Services → Library</strong></li>
            <li>Search for <strong>"Maps JavaScript API"</strong> and click <strong>Enable</strong></li>
            <li>Go to <strong>APIs & Services → Credentials</strong></li>
            <li>Click on your API key</li>
            <li>Under <strong>"API restrictions"</strong>, make sure <strong>"Maps JavaScript API"</strong> is allowed</li>
            <li>Under <strong>"Application restrictions"</strong>, either set to <strong>"None"</strong> or add <strong>"localhost"</strong> to HTTP referrers</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <Map
      style={{ width: '100vw', height: '100vh' }}
      defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
      defaultZoom={15}
      disableDefaultUI={true}
      styles={mapStyles}
      onError={(e) => {
        console.error('Map error:', e);
        if (e?.message?.includes('ApiTargetBlocked') || e?.message?.includes('blocked')) {
          setError('ApiTargetBlockedMapError: Your API key does not have access to Maps JavaScript API. Please enable it in Google Cloud Console.');
        } else {
          setError(e?.message || 'Failed to load map. Check console for details.');
        }
      }}
    />
  );
}
