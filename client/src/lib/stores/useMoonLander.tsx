import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "menu" | "playing" | "gameOver" | "levelComplete";

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface LandingPad {
  x: number;
  y: number;
  width: number;
}

interface ShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
}

interface MoonLanderState {
  phase: GamePhase;
  level: number;
  score: number;
  fuel: number;
  ship: ShipState;
  terrain: TerrainPoint[];
  landingPad: LandingPad;
  
  startGame: () => void;
  nextLevel: () => void;
  gameOver: () => void;
  levelComplete: () => void;
  updateShip: (ship: Partial<ShipState>) => void;
  useFuel: (amount: number) => void;
  addScore: (points: number) => void;
  generateTerrain: (level: number, canvasWidth: number, canvasHeight: number) => void;
  reset: () => void;
}

const INITIAL_FUEL = 1000;

export const useMoonLander = create<MoonLanderState>()(
  subscribeWithSelector((set, get) => ({
    phase: "menu",
    level: 1,
    score: 0,
    fuel: INITIAL_FUEL,
    ship: {
      x: 100,
      y: 50,
      vx: 0,
      vy: 0,
      rotation: 0,
    },
    terrain: [],
    landingPad: { x: 0, y: 0, width: 0 },
    
    startGame: () => {
      set({ 
        phase: "playing",
        level: 1,
        score: 0,
        fuel: INITIAL_FUEL,
        ship: {
          x: 100,
          y: 50,
          vx: 20,
          vy: 0,
          rotation: 0,
        }
      });
    },
    
    nextLevel: () => {
      const { level, score } = get();
      const bonusScore = 500 + (level * 100);
      set({ 
        phase: "playing",
        level: level + 1,
        score: score + bonusScore,
        fuel: INITIAL_FUEL,
        ship: {
          x: 100,
          y: 50,
          vx: 20,
          vy: 0,
          rotation: 0,
        }
      });
    },
    
    gameOver: () => {
      set({ phase: "gameOver" });
    },
    
    levelComplete: () => {
      set({ phase: "levelComplete" });
    },
    
    updateShip: (shipUpdate) => {
      set((state) => ({
        ship: { ...state.ship, ...shipUpdate }
      }));
    },
    
    useFuel: (amount) => {
      set((state) => ({
        fuel: Math.max(0, state.fuel - amount)
      }));
    },
    
    addScore: (points) => {
      set((state) => ({
        score: state.score + points
      }));
    },
    
    generateTerrain: (level, canvasWidth, canvasHeight) => {
      const terrain: TerrainPoint[] = [];
      const segments = 20 + level * 2;
      const baseRoughness = 20 + level * 10;
      const maxHeight = canvasHeight * 0.7;
      const minHeight = canvasHeight * 0.4;
      
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * canvasWidth;
        let y = minHeight + Math.random() * (maxHeight - minHeight);
        
        if (i > 0 && i < segments) {
          y = terrain[i - 1].y + (Math.random() - 0.5) * baseRoughness;
          y = Math.max(minHeight, Math.min(maxHeight, y));
        }
        
        terrain.push({ x, y });
      }
      
      const landingSegment = Math.floor(segments * 0.3) + Math.floor(Math.random() * (segments * 0.4));
      const padWidth = Math.max(60, 100 - level * 5);
      const padY = terrain[landingSegment].y;
      
      terrain[landingSegment].y = padY;
      if (landingSegment + 1 < terrain.length) {
        terrain[landingSegment + 1].y = padY;
      }
      
      set({
        terrain,
        landingPad: {
          x: terrain[landingSegment].x,
          y: padY,
          width: padWidth
        }
      });
    },
    
    reset: () => {
      set({
        phase: "menu",
        level: 1,
        score: 0,
        fuel: INITIAL_FUEL,
        ship: {
          x: 100,
          y: 50,
          vx: 0,
          vy: 0,
          rotation: 0,
        },
        terrain: [],
        landingPad: { x: 0, y: 0, width: 0 }
      });
    }
  }))
);
