import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

interface LandThumbnailProps {
  size?: number;
}

/**
 * Miniature 3D isometric thumbnail for Sunny Meadow Plateau (阳光原野).
 * Renders the vibrant lime meadow top, scalloped grass overhang, and golden clay cliff with slate stones.
 */
export function SunnyMeadowThumbnail({ size = 36 }: LandThumbnailProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Defs>
        <LinearGradient id="meadowTopGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#C8E82E" />
          <Stop offset="100%" stopColor="#B4D820" />
        </LinearGradient>
        <LinearGradient id="cliffLeftGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#D59B2E" />
          <Stop offset="100%" stopColor="#B87E18" />
        </LinearGradient>
        <LinearGradient id="cliffRightGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#A66C12" />
          <Stop offset="100%" stopColor="#844E08" />
        </LinearGradient>
      </Defs>

      {/* Floating Island Ground Shadow */}
      <Ellipse cx="22" cy="38" rx="17" ry="4.5" fill="rgba(25, 40, 10, 0.22)" />

      {/* Front-Left Cliff Face (Sunlit golden clay) */}
      <Polygon points="5,17 22,25.5 22,34.5 5,26" fill="url(#cliffLeftGrad)" />
      {/* Front-Left Crevice Shading */}
      <Path d="M 13.5,21.25 L 13.5,30.25" stroke="#9E6812" strokeWidth="0.8" opacity="0.6" />
      {/* Front-Left Base Rim */}
      <Polygon points="5,24.5 22,33 22,34.5 5,26" fill="#623806" opacity="0.4" />

      {/* Front-Right Cliff Face (Shadow amber clay) */}
      <Polygon points="22,25.5 39,17 39,26 22,34.5" fill="url(#cliffRightGrad)" />
      {/* Front-Right Crevice Shading */}
      <Path d="M 30.5,21.25 L 30.5,30.25" stroke="#683E06" strokeWidth="0.8" opacity="0.6" />
      {/* Front-Right Base Rim */}
      <Polygon points="22,33 39,24.5 39,26 22,34.5" fill="#623806" opacity="0.4" />



      {/* Scalloped Wavy Grass Overhang Lip (Front Left) */}
      <Path
        d="M 5,17 L 22,25.5 Q 17.5,27.5 13.5,24 Q 9.5,25.5 5,17 Z"
        fill="#96BC18"
      />
      {/* Scalloped Wavy Grass Overhang Lip (Front Right) */}
      <Path
        d="M 22,25.5 L 39,17 Q 34.5,25.5 30.5,24 Q 26.5,27.5 22,25.5 Z"
        fill="#82A614"
      />

      {/* Top Meadow Diamond Face */}
      <Polygon points="22,8.5 39,17 22,25.5 5,17" fill="url(#meadowTopGrad)" />
      {/* Grid Seam Cross Line */}
      <Path d="M 13.5,12.75 L 30.5,21.25" stroke="rgba(105, 145, 18, 0.45)" strokeWidth="0.75" />
      <Path d="M 30.5,12.75 L 13.5,21.25" stroke="rgba(105, 145, 18, 0.45)" strokeWidth="0.75" />

      {/* Dappled Sunlit Moss Circles */}
      <Ellipse cx="16" cy="18" rx="2.5" ry="1.3" fill="rgba(238, 252, 130, 0.55)" />
      <Ellipse cx="27" cy="15" rx="3.0" ry="1.5" fill="rgba(238, 252, 130, 0.55)" />
      <Ellipse cx="22" cy="12" rx="2.2" ry="1.1" fill="rgba(215, 240, 85, 0.5)" />

      {/* Little Micro Daisy Flower */}
      <Circle cx="20" cy="19" r="1.3" fill="#FFFFFF" />
      <Circle cx="20" cy="19" r="0.55" fill="#F8B818" />

      {/* Little Micro Dandelion Dot */}
      <Circle cx="29" cy="17" r="0.9" fill="#F6CA34" />

      {/* Little Micro Grass Tuft Arch */}
      <Path
        d="M 12,17 Q 13,15.5 14,17 Q 15,15.5 16,17"
        stroke="#4E720E"
        strokeWidth="0.7"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Miniature 3D isometric thumbnail for Terraced Grove (灵洲浮岛).
 */
export function TerracedGroveThumbnail({ size = 36 }: LandThumbnailProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Defs>
        <LinearGradient id="groveTopGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#8FBE4A" />
          <Stop offset="100%" stopColor="#7DB866" />
        </LinearGradient>
      </Defs>

      {/* Ground Shadow */}
      <Ellipse cx="22" cy="38" rx="16" ry="4" fill="rgba(15, 45, 35, 0.22)" />

      {/* Base Earth Cliffs */}
      <Polygon points="6,18 22,26 22,34 6,26" fill="#6E513E" />
      <Polygon points="22,26 38,18 38,26 22,34" fill="#563E2F" />

      {/* Stepped Terraces */}
      <Polygon points="22,10 38,18 22,26 6,18" fill="url(#groveTopGrad)" />
      <Polygon points="22,7 34,13 22,19 10,13" fill="#8FBE4A" opacity="0.9" />

      {/* Cute Little Mini Tree */}
      <Path d="M 22,15 L 22,12" stroke="#8A6F52" strokeWidth="1.2" strokeLinecap="round" />
      <Circle cx="22" cy="10" r="3.2" fill="#3D7A46" />
      <Circle cx="21.5" cy="9.2" r="2.4" fill="#5BA665" />
    </Svg>
  );
}
