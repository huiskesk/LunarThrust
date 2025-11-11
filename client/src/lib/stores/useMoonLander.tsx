import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";

export type GamePhase = "menu" | "playing" | "gameOver" | "levelComplete";

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface LandingPad {
  x: number;
  y: number;
  width: number;
  bonus: number;
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
  highScore: number;
  fuel: number;
  ship: ShipState;
  terrain: TerrainPoint[];
  landingPads: LandingPad[];
  
  startGame: () => void;
  nextLevel: () => void;
  gameOver: () => void;
  levelComplete: () => void;
  updateShip: (ship: Partial<ShipState>) => void;
  useFuel: (amount: number) => void;
  addScore: (points: number) => void;
  generateTerrain: (level: number, canvasWidth: number, canvasHeight: number) => void;
  initializeShipPosition: (canvasWidth: number) => void;
  reset: () => void;
}

const INITIAL_FUEL = 1000;
const HIGH_SCORE_KEY = "moonLanderHighScore";

const loadHighScore = (): number => {
  const saved = getLocalStorage(HIGH_SCORE_KEY);
  return saved !== null ? saved : 0;
};

export const useMoonLander = create<MoonLanderState>()(
  subscribeWithSelector((set, get) => ({
    phase: "menu",
    level: 1,
    score: 0,
    highScore: loadHighScore(),
    fuel: INITIAL_FUEL,
    ship: {
      x: 100,
      y: 50,
      vx: 0,
      vy: 0,
      rotation: 0,
    },
    terrain: [],
    landingPads: [],
    
    startGame: () => {
      set({ 
        phase: "playing",
        level: 1,
        score: 0,
        fuel: INITIAL_FUEL,
        ship: {
          x: 100,
          y: 50,
          vx: 0.5,
          vy: 0,
          rotation: 0,
        }
      });
    },
    
    nextLevel: () => {
      const { level, score, highScore } = get();
      const bonusScore = 500 + (level * 100);
      const newScore = score + bonusScore;
      const newHighScore = Math.max(newScore, highScore);
      
      if (newHighScore > highScore) {
        setLocalStorage(HIGH_SCORE_KEY, newHighScore);
      }
      
      set({ 
        phase: "playing",
        level: level + 1,
        score: newScore,
        highScore: newHighScore,
        fuel: INITIAL_FUEL,
        ship: {
          x: 100,
          y: 50,
          vx: 0.5,
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
      set((state) => {
        const newScore = state.score + points;
        const newHighScore = Math.max(newScore, state.highScore);
        
        if (newHighScore > state.highScore) {
          setLocalStorage(HIGH_SCORE_KEY, newHighScore);
        }
        
        return {
          score: newScore,
          highScore: newHighScore
        };
      });
    },
    
    generateTerrain: (level, canvasWidth, canvasHeight) => {
      const terrain: TerrainPoint[] = [];
      const segments = 20 + level * 2;
      const baseRoughness = 20 + level * 10;
      const maxHeight = canvasHeight * 0.9;
      const minHeight = canvasHeight * 0.7;
      
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * canvasWidth;
        let y = minHeight + Math.random() * (maxHeight - minHeight);
        
        if (i > 0 && i < segments) {
          y = terrain[i - 1].y + (Math.random() - 0.5) * baseRoughness;
          y = Math.max(minHeight, Math.min(maxHeight, y));
        }
        
        terrain.push({ x, y });
      }
      
      const numPads = Math.min(2 + Math.floor(level / 3), 3);
      const landingPads: LandingPad[] = [];
      const padSegments: number[] = [];
      
      for (let i = 0; i < numPads; i++) {
        const minSeg = Math.floor(segments * 0.2);
        const maxSeg = Math.floor(segments * 0.8);
        let segment: number;
        
        do {
          segment = minSeg + Math.floor(Math.random() * (maxSeg - minSeg));
        } while (padSegments.some(s => Math.abs(s - segment) < segments / (numPads + 2)));
        
        padSegments.push(segment);
        
        const widthMultiplier = 1 / (i + 1);
        const padWidth = Math.max(40, Math.floor((100 - level * 5) * widthMultiplier));
        const bonus = (i + 1) * 0.5;
        const padY = terrain[segment].y;
        
        terrain[segment].y = padY;
        if (segment + 1 < terrain.length) {
          terrain[segment + 1].y = padY;
        }
        
        landingPads.push({
          x: terrain[segment].x,
          y: padY,
          width: padWidth,
          bonus
        });
      }
      
      set({
        terrain,
        landingPads
      });
    },
    
    initializeShipPosition: (canvasWidth) => {
      set((state) => ({
        ship: {
          ...state.ship,
          x: canvasWidth / 2,
          y: 50,
          vx: 0.5,
          vy: 0,
          rotation: 0
        }
      }));
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
        landingPads: []
      });
    }
  }))
);
