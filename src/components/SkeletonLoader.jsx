import React from "react";

const SkeletonLoader = ({ count = 1, className = "" }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-800 rounded-xl h-24 w-full mb-3 ${className}`}
        />
      ))}
    </>
  );
};

export default SkeletonLoader;
