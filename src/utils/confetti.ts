import confetti from 'canvas-confetti';

/**
 * Fires a standard cheerful burst of confetti from the bottom center.
 */
export const fireConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#E07A5F', '#F2CC8F', '#81B29A', '#3D405B', '#F4F1DE'],
    disableForReducedMotion: true
  });
};

/**
 * Fires a continuous side-to-side fireworks show for a specified duration.
 * @param durationMs Duration of fireworks in milliseconds
 */
export const fireContinuousFireworks = (durationMs: number = 3000) => {
  const animationEnd = Date.now() + durationMs;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 1000,
    colors: ['#E07A5F', '#F2CC8F', '#81B29A', '#3D405B', '#F4F1DE']
  };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / durationMs);

    // Stream fireworks from left and right boundaries
    confetti({ 
      ...defaults, 
      particleCount, 
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
    });
    confetti({ 
      ...defaults, 
      particleCount, 
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
    });
  }, 200);
};
