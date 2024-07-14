import React from 'react';

export const Button = () => {
  return (
    <button
      className="w-20 h-20 bg-black text-white"
      onClick={() => alert(`Hello from your  app!`)}
    >
        Click me
    </button>
  );
};
