import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative w-8 h-8">
        {/* Base layer - stylized Q */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-tl-2xl rounded-br-2xl transform rotate-45"></div>
        {/* Gold bar overlay */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600 transform -translate-y-1/2 skew-x-12"></div>
        {/* Dot */}
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-amber-600 bg-clip-text text-transparent">
        QuantEdge Alpha
      </span>
    </div>
  );
}