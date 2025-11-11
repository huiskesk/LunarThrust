import { useEffect, useRef, useState } from "react";
import { useMoonLander } from "@/lib/stores/useMoonLander";
import { useAudio } from "@/lib/stores/useAudio";

const GRAVITY = 0.02;
const VERTICAL_THRUST_POWER = 0.12;
const HORIZONTAL_THRUST_POWER = 0.03;
const FUEL_CONSUMPTION = 0.5;
const MAX_SAFE_LANDING_SPEED = 2;
const MAX_SAFE_HORIZONTAL_SPEED = 1.5;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

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
    landingPads,
    updateShip,
    useFuel,
    addScore,
    gameOver,
    levelComplete,
    generateTerrain,
    initializeShipPosition,
    nextLevel
  } = useMoonLander();
  
  const { playSuccess, playHit, startThruster, stopThruster } = useAudio();
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const thrusterActiveRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  
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
      initializeShipPosition(canvasSize.width);
    }
  }, [phase, level, terrain.length, canvasSize, generateTerrain, initializeShipPosition]);
  
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
      
      const anyThrusterActive = fuel > 0 && (
        keysPressed.current.has('ArrowDown') ||
        keysPressed.current.has('ArrowLeft') ||
        keysPressed.current.has('ArrowRight')
      );
      
      if (anyThrusterActive && !thrusterActiveRef.current) {
        startThruster();
        thrusterActiveRef.current = true;
      } else if (!anyThrusterActive && thrusterActiveRef.current) {
        stopThruster();
        thrusterActiveRef.current = false;
      }
      
      if (fuel > 0) {
        if (keysPressed.current.has('ArrowDown')) {
          newVY -= VERTICAL_THRUST_POWER * deltaTime;
          useFuel(FUEL_CONSUMPTION * deltaTime);
          generateParticles(ship.x, ship.y + 15, 0, 3, ship.rotation);
        }
        if (keysPressed.current.has('ArrowLeft')) {
          newVX -= HORIZONTAL_THRUST_POWER * deltaTime;
          useFuel(FUEL_CONSUMPTION * deltaTime);
          generateParticles(ship.x + 10 * Math.cos(ship.rotation), ship.y + 10 * Math.sin(ship.rotation), 2, 0, ship.rotation);
        }
        if (keysPressed.current.has('ArrowRight')) {
          newVX += HORIZONTAL_THRUST_POWER * deltaTime;
          useFuel(FUEL_CONSUMPTION * deltaTime);
          generateParticles(ship.x - 10 * Math.cos(ship.rotation), ship.y - 10 * Math.sin(ship.rotation), -2, 0, ship.rotation);
        }
      }
      
      updateParticles(deltaTime);
      
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
      stopThruster();
      thrusterActiveRef.current = false;
    };
  }, [phase, ship, fuel, terrain, landingPads, updateShip, useFuel, gameOver, levelComplete, startThruster, stopThruster]);
  
  const generateParticles = (x: number, y: number, vx: number, vy: number, rotation: number) => {
    const numParticles = 2;
    for (let i = 0; i < numParticles; i++) {
      const spread = 0.5;
      const particle: Particle = {
        x,
        y,
        vx: vx + (Math.random() - 0.5) * spread,
        vy: vy + (Math.random() - 0.5) * spread,
        life: 1,
        maxLife: 1,
        color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
      };
      particlesRef.current.push(particle);
    }
    
    if (particlesRef.current.length > 200) {
      particlesRef.current = particlesRef.current.slice(-200);
    }
  };
  
  const updateParticles = (deltaTime: number) => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.life -= deltaTime * 0.05;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += GRAVITY * 0.5 * deltaTime;
      return p.life > 0;
    });
  };
  
  const generateExplosion = (x: number, y: number) => {
    const numParticles = 50;
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles;
      const speed = 2 + Math.random() * 4;
      const particle: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: Math.random() > 0.5 ? '#ff0000' : '#ffaa00'
      };
      particlesRef.current.push(particle);
    }
  };
  
  const checkCollision = (x: number, y: number, vx: number, vy: number): boolean => {
    const shipBottom = y + 15;
    const shipLeft = x - 10;
    const shipRight = x + 10;
    
    if (x < 0 || x > canvasSize.width || y < 0 || y > canvasSize.height) {
      generateExplosion(x, y);
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
          let landedPad = null;
          for (const pad of landingPads) {
            if (x >= pad.x && x <= pad.x + pad.width && Math.abs(terrainYAtShip - pad.y) < 2) {
              landedPad = pad;
              break;
            }
          }
          
          if (landedPad) {
            const speed = Math.sqrt(vx * vx + vy * vy);
            const isSlowEnough = Math.abs(vy) < MAX_SAFE_LANDING_SPEED && Math.abs(vx) < MAX_SAFE_HORIZONTAL_SPEED;
            
            if (isSlowEnough) {
              const baseScore = Math.floor(500 - speed * 50 + (fuel / 10));
              const landingScore = Math.floor(baseScore * landedPad.bonus);
              addScore(landingScore);
              playSuccess();
              levelComplete();
              return true;
            } else {
              generateExplosion(x, y);
              playHit();
              gameOver();
              return true;
            }
          } else {
            generateExplosion(x, y);
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
    
    landingPads.forEach(pad => {
      let color = '#00ff00';
      let label = 'EASY';
      if (pad.bonus >= 1.5) {
        color = '#ff0000';
        label = 'HARD';
      } else if (pad.bonus >= 1.0) {
        color = '#ffff00';
        label = 'MEDIUM';
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pad.x, pad.y);
      ctx.lineTo(pad.x + pad.width, pad.y);
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.font = '12px monospace';
      ctx.fillText(`${label} x${pad.bonus.toFixed(1)}`, pad.x + 5, pad.y - 10);
    });
    
    particlesRef.current.forEach(p => {
      const opacity = p.life / p.maxLife;
      ctx.fillStyle = p.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    });
    
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
