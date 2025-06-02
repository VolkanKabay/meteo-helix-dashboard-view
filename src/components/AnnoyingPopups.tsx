import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const annoyingMessages = [
  "Hey! Did you know you can refresh the data?",
  "Don't forget to check the weather!",
  "Your weather data is getting lonely!",
  "Time for a weather check!",
  "Weather updates are waiting for you!",
  "Don't miss out on the latest weather!",
  "Your dashboard misses you!",
  "Weather data is getting stale!",
  "Time for a refresh!",
  "Don't forget about your weather dashboard!"
];

const AnnoyingPopups: React.FC = () => {
  const [popups, setPopups] = useState<{ id: number; message: string; position: { x: number; y: number } }[]>([]);
  const [nextId, setNextId] = useState(0);

  const getRandomPosition = () => {
    const x = Math.random() * (window.innerWidth - 300);
    const y = Math.random() * (window.innerHeight - 100);
    return { x, y };
  };

  useEffect(() => {
    // Show first popup after 2 seconds
    const initialTimer = setTimeout(() => {
      addPopup();
    }, 2000);

    // Show subsequent popups every second
    const interval = setInterval(() => {
      addPopup();
    }, 1000);

    // Make popups reappear after being dismissed
    const reappearInterval = setInterval(() => {
      if (popups.length < 5) {
        addPopup();
      }
    }, 3000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      clearInterval(reappearInterval);
    };
  }, [popups.length]);

  const addPopup = () => {
    const randomMessage = annoyingMessages[Math.floor(Math.random() * annoyingMessages.length)];
    setPopups(prev => [...prev, { 
      id: nextId, 
      message: randomMessage,
      position: getRandomPosition()
    }]);
    setNextId(prev => prev + 1);
  };

  const removePopup = (id: number) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  return (
    <>
      {popups.map(popup => (
        <div
          key={popup.id}
          className="fixed z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-sm animate-slide-in"
          style={{
            left: popup.position.x,
            top: popup.position.y,
            animation: 'slideIn 0.3s ease-out',
            transform: 'translateX(0)',
          }}
        >
          <div className="flex items-start justify-between">
            <p className="text-gray-800 font-medium">{popup.message}</p>
            <button
              onClick={() => removePopup(popup.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default AnnoyingPopups; 