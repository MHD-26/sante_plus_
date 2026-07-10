import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 48 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* 
        We use premium solid-color layered vector shapes instead of gradient ID definitions (url(#...)).
        This guarantees 100% reliable rendering in all browsers, iframes, full-screen tabs, and routing setups.
      */}
      
      {/* 1. Lighter 3D shift/accent arm in the background (mint/sage green) */}
      <path
        d="M 82 35 A 10 10 0 0 1 92 25 L 122 25 A 10 10 0 0 1 132 35 L 132 75 L 172 75 A 10 10 0 0 1 182 85 L 182 115 A 10 10 0 0 1 172 125 L 132 125 L 132 165 A 10 10 0 0 1 122 175 L 92 175 A 10 10 0 0 1 82 165 Z"
        fill="#a7f3d0"
        opacity="0.9"
      />

      {/* 2. Main Medical Cross Body (rich brand emerald green) */}
      <path
        d="M 68 45 A 10 10 0 0 1 78 35 L 108 35 A 10 10 0 0 1 118 45 L 118 75 L 158 75 A 10 10 0 0 1 168 85 L 168 115 A 10 10 0 0 1 158 125 L 118 125 L 118 155 A 10 10 0 0 1 108 165 L 78 165 A 10 10 0 0 1 68 155 L 68 125 L 38 125 A 10 10 0 0 1 28 115 L 28 85 A 10 10 0 0 1 38 75 L 68 75 Z"
        fill="#059669"
      />

      {/* 3. Outer dark-leaf shadow backing for depth */}
      <path
        d="M 82 172 C 82 144 90 108 118 88 C 133 78 155 75 174 76 C 174 93 169 116 152 133 C 130 155 103 170 82 172 Z"
        fill="#043e2f"
        opacity="0.15"
      />

      {/* 4. The Graceful Leaf Overlay - Main Leaf Shape (deep forest green) */}
      <path
        d="M 85 170 C 85 145 92 110 120 90 C 135 80 155 77 172 78 C 172 95 167 118 150 135 C 130 155 105 168 85 170 Z"
        fill="#047857"
      />

      {/* 5. Inner Vibrant Leaf Highlight (medium green) */}
      <path
        d="M 100 158 C 100 135 110 112 135 94 C 148 85 162 81 172 80 C 171 94 165 112 152 126 C 134 144 116 155 100 158 Z"
        fill="#10b981"
      />

      {/* 6. Pure White Elegant Leaf Vein / Accent Stem (super crisp & visible) */}
      <path
        d="M 85 170 C 95 140 115 110 172 78"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* 7. Subtle Upper Leaf Light-Green Accent */}
      <path
        d="M 115 145 C 120 130 130 115 172 78 C 150 102 135 125 115 145 Z"
        fill="#d1fae5"
        opacity="0.9"
      />
    </svg>
  );
}

