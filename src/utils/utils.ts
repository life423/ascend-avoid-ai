/**
 * Utility functions for the game
 * Now with TypeScript support.
 */
/**
 * Generates a random integer between min and max (inclusive)
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random integer between min and max
 */
export function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Singleton audio context to avoid multiple instances
let audioContext: AudioContext | null = null;

/**
 * Sound types available in the game
 */
export type SoundType = 'collision' | 'score' | string;

/**
 * Play a simple sound effect
 * @param type - The type of sound ('collision', 'score', etc.)
 * @param volume - The volume of the sound (0-1)
 */
export function playSound(type: SoundType, volume: number = 0.1): void {
  // Don't attempt sound on browsers that don't support AudioContext
  if (!('AudioContext' in window) && !('webkitAudioContext' in window)) {
    return;
  }
  
  try {
    // Create AudioContext only once
    if (!audioContext) {
      try {
        // Use type assertion to avoid TypeScript errors with webkitAudioContext
        const AudioContextClass = window.AudioContext || 
          (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
      } catch (e) {
        console.log("Failed to create AudioContext:", e);
        return; // Exit if we can't create the context
      }
    }
    
    // Don't proceed if audio context is in a bad state
    if (audioContext.state === 'suspended' || audioContext.state === 'closed') {
      try {
        audioContext.resume();
      } catch (e) {
        console.log("Failed to resume AudioContext:", e);
        return;
      }
    }
    
    // Create gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume; // Control volume through parameter
    gainNode.connect(audioContext.destination);
    
    // Create and configure oscillator
    const oscillator = audioContext.createOscillator();
    
    switch (type) {
      case 'collision':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3 note
        break;
      case 'score':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        break;
      default:
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
    }
    
    // Connect to gain node instead of directly to destination
    oscillator.connect(gainNode);
    
    // Add fade out
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    // Play the sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.log("Error playing sound:", e);
  }
}

// Global scaling factor for game elements
export let SCALE_FACTOR = 1;

// Base canvas dimensions - will be used as a reference for scaling
export const BASE_CANVAS_WIDTH = 560;
export const BASE_CANVAS_HEIGHT = 550;

// Aspect ratio of the game
export const ASPECT_RATIO = BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH;


/**
 * Checks if two rectangles are colliding
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns Whether the rectangles are colliding
 */
export function checkCollision(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Debounces a function call
 * @param func - The function to debounce
 * @param wait - The time to wait in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait);
  };
}

// Fun name generation
const ADJECTIVES = ["Swift", "Brave", "Clever", "Mighty", "Sly", "Nimble", "Fierce", "Lucky", "Wild", "Epic"];
const ANIMALS = ["Tiger", "Falcon", "Panda", "Panther", "Fox", "Eagle", "Shark", "Dragon", "Wolf", "Unicorn"];

/**
 * Generates a random fun username using adjective + animal combination
 * @returns A random username like "Swift Falcon" or "Brave Panda"
 */
export function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}
