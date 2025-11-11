import { useEffect, useRef, useState } from "react";
import { useMoonLander } from "@/lib/stores/useMoonLander";
import { useAudio } from "@/lib/stores/useAudio";

const GRAVITY = 0.15;
const THRUST_POWER = 0.3;
const FUEL_CONSUMPTION = 0.5;
const MAX_SAFE_LANDING_SPEED = 3;
const MAX_SAFE_HORIZONTAL_SPEED = 2;

export function MoonLander() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  
  const { 
    phase, 
    level, 
    fuel, 
    ship, 
    terrain, 
    landingPad,
    updateShip,
    useFuel,
    addScore,
    gameOver,
    levelComplete,
    generateTerrain,
    nextLevel
  } = useMoonLander();
  
  const { playSuccess, playHit } = useAudio();
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  useEffect(() => {
    if (phase === "playing" && terrain.length === 0) {
      generateTerrain(level, canvasSize.width, canvasSize.height);
    }
  }, [phase, level, terrain.length, canvasSize, generateTerrain]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key);
        console.log('Key pressed:', e.key);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
      lastTime = currentTime;
      
      let newVX = ship.vx;
      let newVY = ship.vy;
      let newRotation = ship.rotation;
      
      if (fuel > 0) {
        if (keysPressed.current.has('ArrowDown')) {
          newVY -= THRUST_POWER * deltaTime;
          useFuel(FUEL_CONSUMPTION * deltaTime);
        }
        if (keysPressed.current.has('ArrowLeft')) {
          newVX -= THRUST_POWER * deltaTime;
          useFuel(FUEL_CONSUMPTION * deltaTime);
        }
        if (keysPressed.current.has('ArrowRight')) {
          newVX += THRUST_POWER * deltaTime;
          useFuel(FUEL_CONSUMPTION * deltaTime);
        }
      }
      
      newVY += GRAVITY * deltaTime;
      
      const targetRotation = Math.atan2(newVX, -newVY) * 0.3;
      newRotation += (targetRotation - newRotation) * 0.1;
      
      const newX = ship.x + newVX * deltaTime;
      const newY = ship.y + newVY * deltaTime;
      
      const crashed = checkCollision(newX, newY, newVX, newVY);
      
      if (!crashed) {
        updateShip({
          x: newX,
          y: newY,
          vx: newVX,
          vy: newVY,
          rotation: newRotation
        });
      }
      
      render(ctx, canvas.width, canvas.height);
      
      if (phase === "playing") {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, ship, fuel, terrain, landingPad, updateShip, useFuel, gameOver, levelComplete]);
  
  const checkCollision = (x: number, y: number, vx: number, vy: number): boolean => {
    const shipBottom = y + 15;
    const shipLeft = x - 10;
    const shipRight = x + 10;
    
    if (x < 0 || x > canvasSize.width || y < 0 || y > canvasSize.height) {
      playHit();
      gameOver();
      return true;
    }
    
    for (let i = 0; i < terrain.length - 1; i++) {
      const t1 = terrain[i];
      const t2 = terrain[i + 1];
      
      if (shipRight >= t1.x && shipLeft <= t2.x) {
        const terrainYAtShip = t1.y + ((t2.y - t1.y) * (x - t1.x) / (t2.x - t1.x));
        
        if (shipBottom >= terrainYAtShip) {
          const isOnLandingPad = 
            x >= landingPad.x && 
            x <= landingPad.x + landingPad.width &&
            Math.abs(terrainYAtShip - landingPad.y) < 2;
          
          if (isOnLandingPad) {
            const speed = Math.sqrt(vx * vx + vy * vy);
            const isSlowEnough = Math.abs(vy) < MAX_SAFE_LANDING_SPEED && Math.abs(vx) < MAX_SAFE_HORIZONTAL_SPEED;
            
            if (isSlowEnough) {
              const landingScore = Math.floor(500 - speed * 50 + (fuel / 10));
              addScore(landingScore);
              playSuccess();
              levelComplete();
              return true;
            } else {
              playHit();
              gameOver();
              return true;
            }
          } else {
            playHit();
            gameOver();
            return true;
          }
        }
      }
    }
    
    return false;
  };
  
  const render = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    const stars = 100;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < stars; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 217.3) % height;
      if (y < height * 0.3) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    terrain.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = '#222222';
    ctx.fill();
    ctx.stroke();
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(landingPad.x, landingPad.y);
    ctx.lineTo(landingPad.x + landingPad.width, landingPad.y);
    ctx.stroke();
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText('LAND HERE', landingPad.x + 5, landingPad.y - 10);
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);
    
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-10, 15);
    ctx.lineTo(10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    if (fuel > 0) {
      if (keysPressed.current.has('ArrowDown')) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-5, 15);
        ctx.lineTo(0, 25);
        ctx.lineTo(5, 15);
        ctx.closePath();
        ctx.fill();
      }
      if (keysPressed.current.has('ArrowLeft')) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(20, 0);
        ctx.lineTo(10, -5);
        ctx.closePath();
        ctx.fill();
      }
      if (keysPressed.current.has('ArrowRight')) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-10, 5);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-10, -5);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    ctx.restore();
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{ display: 'block' }}
    />
  );
}
