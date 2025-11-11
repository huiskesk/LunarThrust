import { useEffect } from "react";
import { useAudio } from "@/lib/stores/useAudio";

export function SoundManager() {
  const { setHitSound, setSuccessSound, setThrusterSound } = useAudio();
  
  useEffect(() => {
    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.5;
    setHitSound(hitSound);
    
    const successSound = new Audio('/sounds/success.mp3');
    successSound.volume = 0.5;
    setSuccessSound(successSound);
    
    const thrusterSound = new Audio('/sounds/background.mp3');
    thrusterSound.volume = 0.15;
    setThrusterSound(thrusterSound);
    
    console.log('Sound effects loaded');
  }, [setHitSound, setSuccessSound, setThrusterSound]);
  
  return null;
}
