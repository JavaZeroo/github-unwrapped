import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { Planet } from "../../src/config";
import {
  planetToCTABg,
  planetToCTAGradient,
  planetToCatColor,
} from "../planets";

const padding = 10;
const iconHeight = 120;

export const CallToAction: React.FC<{
  readonly exitProgress: number;
  readonly enterProgress: number;
  readonly planet: Planet;
}> = ({ exitProgress, enterProgress, planet }) => {
  const startDistance = 10;
  const stillDistance = 1;
  const endDistance = 0.1;

  const distance = interpolate(
    enterProgress + exitProgress,
    [0, 1, 2],
    [startDistance, stillDistance, endDistance],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const scale = 1 / distance;

  const enterOffset =
    (Math.sin(enterProgress * Math.PI * 0.5 - Math.PI) + 1) * -600;
  const onSinus = -exitProgress * Math.PI * 0.8 - Math.PI * 0.5;

  const offset = (Math.sin(onSinus) + 1) * -200;

  const backgroundColor = useMemo(() => {
    return planetToCTABg(planet);
  }, [planet]);

  const border = useMemo(() => {
    return "2px solid rgba(255, 255, 255, 0.2)";
  }, []);

  const gradient = useMemo(() => {
    return planetToCTAGradient(planet);
  }, [planet]);

  const catColor = useMemo(() => {
    return planetToCatColor(planet);
  }, [planet]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `translateY(${enterOffset}px) scale(${scale}) translateY(${offset}px)`,
      }}
    >
      <div
        style={{
          backgroundColor,
          border,
          paddingLeft: padding,
          paddingRight: padding * 3,
          flexDirection: "row",
          display: "flex",
          height: iconHeight + padding * 2,
          borderRadius: (iconHeight + padding) / 2,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <svg
          style={{
            height: iconHeight,
            marginRight: 30,
          }}
          viewBox="0 0 1024 1024"
        >
          <path
            fill={catColor}
            d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-.007 63.206c0 13.971 11.322 25.293 25.292 25.293h177.024c13.97 0 25.293 11.322 25.293 25.293v12.646a75.88 75.88 0 0 1-75.88 75.88h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.88 75.88 0 0 1 75.854-75.88h353.946a25.293 25.293 0 0 0 25.267-25.292l.006-63.206a25.293 25.293 0 0 0-25.293-25.293H417.203a189.7 189.7 0 0 0-189.7 189.7v353.946c0 13.971 11.322 25.293 25.292 25.293h372.412a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"
          />
        </svg>
        <div>
          <div
            style={{
              fontFamily: "Mona Sans",
              color: "white",
              fontSize: 30,
              fontWeight: "500",
              backgroundClip: "text",
              backgroundImage: gradient,
              WebkitBackgroundClip: "text",
              backgroundColor: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Get your Year in Review
          </div>
          <div
            style={{
              fontFamily: "Mona Sans",
              color: "white",
              fontSize: 50,
              fontWeight: "bold",
              backgroundClip: "text",
              backgroundImage: gradient,
              WebkitBackgroundClip: "text",
              backgroundColor: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GiteeUnwrapped.com
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
