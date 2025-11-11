import { useMoonLander } from "@/lib/stores/useMoonLander";
import { useAudio } from "@/lib/stores/useAudio";

export function MoonLanderMenu() {
  const { phase, level, score, highScore, startGame, nextLevel, reset } = useMoonLander();
  const { toggleMute, isMuted } = useAudio();
  
  if (phase === "playing") return null;
  
  const handleStart = () => {
    if (phase === "levelComplete") {
      nextLevel();
    } else {
      startGame();
    }
  };
  
  const handleRestart = () => {
    reset();
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000
    }}>
      <div style={{
        textAlign: 'center',
        color: '#00ff00',
        fontFamily: 'monospace',
        textShadow: '0 0 10px rgba(0,255,0,0.5)'
      }}>
        {phase === "menu" && (
          <>
            <h1 style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              letterSpacing: '4px'
            }}>
              MOON LANDER
            </h1>
            {highScore > 0 && (
              <div style={{ 
                fontSize: '20px', 
                marginBottom: '20px',
                color: '#ffff00',
                textShadow: '0 0 10px rgba(255,255,0,0.5)'
              }}>
                HIGH SCORE: {highScore}
              </div>
            )}
            <div style={{ 
              fontSize: '16px', 
              marginBottom: '40px',
              lineHeight: '1.6',
              opacity: 0.8
            }}>
              <div>Navigate your lunar module to a safe landing</div>
              <div style={{ marginTop: '20px' }}>
                ← LEFT THRUST<br />
                ↓ DOWN THRUST<br />
                → RIGHT THRUST
              </div>
              <div style={{ marginTop: '20px', fontSize: '14px' }}>
                Land softly on the green pad<br />
                Vertical speed &lt; 3 | Horizontal speed &lt; 2
              </div>
            </div>
            <button
              onClick={handleStart}
              style={{
                padding: '15px 40px',
                fontSize: '24px',
                fontFamily: 'monospace',
                background: 'transparent',
                color: '#00ff00',
                border: '2px solid #00ff00',
                cursor: 'pointer',
                textShadow: '0 0 10px rgba(0,255,0,0.5)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00ff00';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#00ff00';
              }}
            >
              START GAME
            </button>
            
            <div style={{ marginTop: '30px' }}>
              <button
                onClick={toggleMute}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  background: 'transparent',
                  color: '#00ff00',
                  border: '1px solid #00ff00',
                  cursor: 'pointer',
                  opacity: 0.6
                }}
              >
                SOUND: {isMuted ? 'OFF' : 'ON'}
              </button>
            </div>
          </>
        )}
        
        {phase === "gameOver" && (
          <>
            <h1 style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              color: '#ff0000',
              textShadow: '0 0 10px rgba(255,0,0,0.5)'
            }}>
              CRASHED!
            </h1>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>
              LEVEL: {level}
            </div>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>
              FINAL SCORE: {score}
            </div>
            <div style={{ 
              fontSize: '20px', 
              marginBottom: '40px',
              color: '#ffff00',
              textShadow: '0 0 10px rgba(255,255,0,0.5)'
            }}>
              HIGH SCORE: {highScore}
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button
                onClick={handleRestart}
                style={{
                  padding: '15px 30px',
                  fontSize: '20px',
                  fontFamily: 'monospace',
                  background: 'transparent',
                  color: '#00ff00',
                  border: '2px solid #00ff00',
                  cursor: 'pointer'
                }}
              >
                RESTART
              </button>
            </div>
          </>
        )}
        
        {phase === "levelComplete" && (
          <>
            <h1 style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              color: '#00ff00'
            }}>
              LEVEL {level} COMPLETE!
            </h1>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>
              SCORE: {score}
            </div>
            <div style={{ 
              fontSize: '20px', 
              marginBottom: '40px',
              color: '#ffff00',
              textShadow: '0 0 10px rgba(255,255,0,0.5)'
            }}>
              HIGH SCORE: {highScore}
            </div>
            <button
              onClick={handleStart}
              style={{
                padding: '15px 40px',
                fontSize: '24px',
                fontFamily: 'monospace',
                background: 'transparent',
                color: '#00ff00',
                border: '2px solid #00ff00',
                cursor: 'pointer'
              }}
            >
              NEXT LEVEL
            </button>
          </>
        )}
      </div>
    </div>
  );
}
