import React from 'react';

interface PetIconProps {
  size?: number;
  className?: string;
}

export default function PetIcon({ size = 40, className = '' }: PetIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path d="M36 30C36 33.3137 33.3137 36 30 36C26.6863 36 24 33.3137 24 30C24 26.6863 26.6863 24 30 24C33.3137 24 36 26.6863 36 30Z" fill="#8A4FFF"/>
      <path d="M76 30C76 33.3137 73.3137 36 70 36C66.6863 36 64 33.3137 64 30C64 26.6863 66.6863 24 70 24C73.3137 24 76 26.6863 76 30Z" fill="#8A4FFF"/>
      <path d="M36 70C36 73.3137 33.3137 76 30 76C26.6863 76 24 73.3137 24 70C24 66.6863 26.6863 64 30 64C33.3137 64 36 66.6863 36 70Z" fill="#8A4FFF"/>
      <path d="M76 70C76 73.3137 73.3137 76 70 76C66.6863 76 64 73.3137 64 70C64 66.6863 66.6863 64 70 64C73.3137 64 76 66.6863 76 70Z" fill="#8A4FFF"/>
      <path d="M60 50C60 55.5228 55.5228 60 50 60C44.4772 60 40 55.5228 40 50C40 44.4772 44.4772 40 50 40C55.5228 40 60 44.4772 60 50Z" fill="#FF6B98"/>
    </svg>
  );
} 