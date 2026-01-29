"use client";

import React, { CSSProperties, ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

interface SparklesProps {
  className?: string;
  size?: number;
  minSize?: number;
  density?: number;
  speed?: number;
  minSpeed?: number;
  opacity?: number;
  direction?: "top" | "bottom" | "left" | "right";
  opacitySpeed?: number;
  minOpacity?: number;
  color?: string;
  mousemove?: boolean;
  hover?: boolean;
  background?: string;
  options?: {
    [key: string]: string | number | boolean;
  };
  children?: ReactNode;
}

export default function Sparkles({
  className,
  size = 1.2,
  minSize,
  density = 800,
  speed = 1.5,
  minSpeed,
  opacity = 1,
  direction = "top",
  opacitySpeed = 3,
  minOpacity,
  color = "#ffffff",
  mousemove = false,
  hover = false,
  background,
  options = {},
  children,
  ...props
}: SparklesProps) {
  const id = useId();

  return (
    <div
      {...props}
      className={cn("relative h-full w-full", className)}
      style={
        {
          "--sparkles-size": minSize ? `${minSize}rem` : `${size / 2}rem`,
          "--sparkles-max-size": `${size}rem`,
          "--sparkles-density": density,
          "--sparkles-speed": minSpeed ? `${minSpeed}s` : `${speed / 2}s`,
          "--sparkles-max-speed": `${speed}s`,
          "--sparkles-opacity": minOpacity ?? opacity / 2,
          "--sparkles-max-opacity": opacity,
          "--sparkles-direction": direction,
          "--sparkles-opacity-speed": `${opacitySpeed}s`,
          "--sparkles-color": color,
          background: background,
          ...options,
        } as CSSProperties
      }
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <symbol id={`${id}-sparkle`}>
            <path
              d="M5 0L6.12257 3.45492L9.51057 2.48943L7.37743 5.5L9.51057 8.51057L6.12257 7.54508L5 11L3.87743 7.54508L0.489435 8.51057L2.62257 5.5L0.489435 2.48943L3.87743 3.45492L5 0Z"
              fill="currentColor"
            />
          </symbol>
        </defs>
        {Array.from({ length: Math.floor(density / 100) }).map((_, i) => {
          const isHoverable = hover ? "sparkle-hover" : "";
          const isMousemove = mousemove ? "sparkle-mousemove" : "";
          return (
            <use
              key={i}
              href={`#${id}-sparkle`}
              className={cn(
                "animate-sparkle",
                isHoverable,
                isMousemove,
                mousemove && "opacity-0"
              )}
              style={
                {
                  ["--i" as string]: i,
                } as CSSProperties
              }
            />
          );
        })}
      </svg>
      {children}
    </div>
  );
}
