/**
 * A lightweight 2D baker avatar drawn with react-native-svg - a direct port of the
 * website's `avatar-face.tsx` (no downloads, no GPU, free).
 *
 * The web drives the blink and the talking mouth with CSS keyframes; React Native
 * has no equivalent inside an SVG, so two small timers toggle the eye height (blink)
 * and the mouth height (while speaking) instead.
 */

import React, { useEffect, useState } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { palette } from '../theme';

export type AvatarMood = 'idle' | 'listening' | 'thinking' | 'speaking';

const BLINK_MS = 150;

export function AvatarFace({ mood, size = 64 }: { mood: AvatarMood; size?: number }) {
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Blink every few seconds.
  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout>;
    const loop = setInterval(() => {
      setBlinking(true);
      closeTimer = setTimeout(() => setBlinking(false), BLINK_MS);
    }, 3200);
    return () => {
      clearInterval(loop);
      clearTimeout(closeTimer);
    };
  }, []);

  // Open and close the mouth while speaking.
  useEffect(() => {
    if (mood !== 'speaking') {
      setMouthOpen(false);
      return;
    }
    const loop = setInterval(() => setMouthOpen((open) => !open), 160);
    return () => clearInterval(loop);
  }, [mood]);

  const eyeY = mood === 'thinking' ? 64 : 67;
  const eyeRy = blinking ? 0.6 : 4;
  const pupilY = mood === 'thinking' ? 62.6 : 65.6;
  const browY = mood === 'listening' ? 58 : 59;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      accessibilityRole="image"
      accessibilityLabel="Sprinkles, the Crazy Cakes assistant"
    >
      <Circle cx={60} cy={60} r={57} fill={palette.blush} />
      <Circle cx={60} cy={60} r={57} fill="none" stroke={palette.primary} strokeWidth={3} />

      {/* Hair */}
      <Path
        d="M30 70c0-24 13-38 30-38s30 14 30 38v16c-6-4-9-14-9-24-11 6-31 7-42 0 0 10-3 20-9 24z"
        fill="#6b4130"
      />
      {/* Face */}
      <Ellipse cx={60} cy={70} rx={25} ry={27} fill="#f7d5bd" />
      {/* Chef hat */}
      <Path
        d="M37 44c-9-1-12-13-4-18 3-9 15-10 19-3 5-7 16-7 20 0 7-4 16 1 15 9 7 4 3 14-5 13v7H37z"
        fill="#ffffff"
        stroke={palette.border}
        strokeWidth={1.5}
      />
      <Rect
        x={36}
        y={44}
        width={48}
        height={8}
        rx={2.5}
        fill="#ffffff"
        stroke={palette.primary}
        strokeWidth={1.5}
      />
      <Circle cx={60} cy={48} r={2} fill={palette.primary} />

      {/* Eyes */}
      <G>
        <Ellipse cx={50} cy={eyeY} rx={3.3} ry={eyeRy} fill="#3b2a22" />
        <Ellipse cx={70} cy={eyeY} rx={3.3} ry={eyeRy} fill="#3b2a22" />
        {blinking ? null : (
          <>
            <Circle cx={51.2} cy={pupilY} r={1.1} fill="#ffffff" />
            <Circle cx={71.2} cy={pupilY} r={1.1} fill="#ffffff" />
          </>
        )}
      </G>
      {/* Brows */}
      <Path
        d={
          mood === 'listening'
            ? 'M44 58q6-4 11 0M65 58q5-4 11 0'
            : `M45 ${browY}q5-3 10 0M65 ${browY}q5-3 10 0`
        }
        stroke="#6b4130"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheeks */}
      <Circle cx={44} cy={78} r={4.5} fill={palette.primary} opacity={0.35} />
      <Circle cx={76} cy={78} r={4.5} fill={palette.primary} opacity={0.35} />

      {/* Mouth */}
      {mood === 'speaking' ? (
        <Ellipse cx={60} cy={85} rx={6} ry={mouthOpen ? 5 : 1.6} fill="#a23e4a" />
      ) : mood === 'listening' ? (
        <Ellipse cx={60} cy={85} rx={3.5} ry={3} fill="#a23e4a" />
      ) : (
        <Path
          d="M51 83q9 8 18 0"
          stroke="#a23e4a"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* Thinking dots */}
      {mood === 'thinking' ? (
        <G fill={palette.primary}>
          <Circle cx={88} cy={30} r={3} />
          <Circle cx={97} cy={24} r={3.5} />
          <Circle cx={107} cy={17} r={4} />
        </G>
      ) : null}
    </Svg>
  );
}