import React from 'react';

const Snowfall: React.FC = () => {
  // Create 50 snowflakes with random positions and delays
  const snowflakes = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 3 + 5}s`, // Between 5-8s
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.3,
    size: Math.random() * 4 + 2, // 2px to 6px
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[10] overflow-hidden" aria-hidden="true">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-10px] bg-white rounded-full animate-fall"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `fall ${flake.animationDuration} linear infinite`,
            animationDelay: flake.animationDelay,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0); }
          100% { transform: translateY(110vh) translateX(20px); }
        }
      `}</style>
    </div>
  );
};

export default Snowfall;
