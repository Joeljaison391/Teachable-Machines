import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  type: 'link' | 'button' | 'submit';
  text: string;
  link?: string;
  action?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ type, text, link, action }) => {
  if (type === 'link' && link) {
    return (
      <Link to={link} className="px-4 py-2 bg-black text-white rounded">
        {text}
      </Link>
    );
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      className="px-4 py-2 bg-black text-white rounded"
      onClick={action}
    >
      {text}
    </button>
  );
};


