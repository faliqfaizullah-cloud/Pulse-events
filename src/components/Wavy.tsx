import React, { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { blobPath, starburstPath } from '../utils/shapes';

type Props = {
  size: number;
  color: string;
  kind?: 'starburst' | 'blob';
  points?: number;
  amp?: number;
};

/** A filled organic shape (scalloped starburst or irregular blob). */
export default function Wavy({ size, color, kind = 'starburst', points = 10, amp = 0.09 }: Props) {
  const d = useMemo(
    () => (kind === 'blob' ? blobPath(size) : starburstPath(size, points, amp)),
    [size, kind, points, amp],
  );
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={d} fill={color} />
    </Svg>
  );
}
