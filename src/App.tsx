import { APIProvider } from '@vis.gl/react-google-maps';
import GameMap from './components/Map/GameMap';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

function App() {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#242f3e', color: '#d59563' }}>
        <div>
          <p>Missing VITE_GOOGLE_MAPS_KEY environment variable</p>
          <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>Add it to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <GameMap />
    </APIProvider>
  );
}

export default App;


