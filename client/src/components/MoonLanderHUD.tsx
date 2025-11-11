import { useMoonLander } from "@/lib/stores/useMoonLander";

export function MoonLanderHUD() {
  const { phase, level, score, fuel, ship } = useMoonLander();
  
  if (phase !== "playing") return null;
  
  const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
  const fuelPercent = (fuel / 1000) * 100;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      padding: '20px',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '16px',
      pointerEvents: 'none',
      textShadow: '0 0 10px rgba(0,255,0,0.5)',
      zIndex: 100,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>LEVEL: {level}</div>
        <div>SCORE: {score}</div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          FUEL: {Math.floor(fuel)}
          <div style={{ 
            marginTop: '5px',
            width: '200px', 
            height: '10px', 
            border: '1px solid #00ff00',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${fuelPercent}%`,
              background: fuelPercent > 30 ? '#00ff00' : '#ff0000',
              transition: 'width 0.1s'
            }} />
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div>SPEED: {speed.toFixed(1)}</div>
          <div style={{ fontSize: '12px', marginTop: '2px' }}>
            H: {Math.abs(ship.vx).toFixed(1)} V: {Math.abs(ship.vy).toFixed(1)}
          </div>
        </div>
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        textAlign: 'center',
        opacity: 0.7
      }}>
        ← LEFT THRUST | ↓ DOWN THRUST | RIGHT THRUST →
      </div>
    </div>
  );
}
