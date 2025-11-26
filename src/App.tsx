import GameMap from './components/Map/GameMap';

function App() {
    return (
        <div className="dark bg-monad-dark text-white">
            {/* Full-screen, mobile-first layout */}
            <div className="flex h-screen w-screen flex-col overflow-hidden">
                {/* Top HUD strip – can later host TPS, wallet, etc. */}
                <header className="z-20 flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-gray-300/90">
                    <span className="font-semibold text-monad-purple drop-shadow-neon-text">
                        Monad Go
                    </span>
                    <span className="rounded-full border border-monad-purple/40 bg-monad-dark/80 px-2 py-0.5 text-[10px] text-gray-200 shadow-neon-soft backdrop-blur-md">
                        GPS: Live
                    </span>
                </header>

                {/* Core game canvas */}
                <main className="relative flex-1">
                    <GameMap />
                </main>
            </div>
        </div>
    );
}

export default App;


