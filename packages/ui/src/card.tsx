import React from "react";

interface CardProps {
  title: string;
  description: string;
  coverImage: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  coverImage,
  children,
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-4 w-64 h-auto p-4">
      <img src={coverImage} alt={title} className="w-full h-32 object-cover" />
      <div className="p-4 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-center mb-2">{title}</h2>
        <p className="text-center text-gray-600 mb-4 ">{description}</p>
        {children}
      </div>
    </div>
  );
};
