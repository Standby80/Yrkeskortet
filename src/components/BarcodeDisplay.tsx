import React from 'react';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  width = 260,
  height = 56,
}) => {
  // Generate deterministic bar widths based on input string
  const bars = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    const pattern: { x: number; w: number }[] = [];
    let currentX = 12;
    let prng = Math.abs(hash);

    // Guard bars at start
    pattern.push({ x: currentX, w: 2 });
    currentX += 4;
    pattern.push({ x: currentX, w: 2 });
    currentX += 6;

    // Data bars
    while (currentX < width - 20) {
      prng = (prng * 16807 + 11) % 2147483647;
      const barW = (prng % 3) + 1.2;
      const spaceW = ((prng >> 3) % 3) + 1.5;
      pattern.push({ x: currentX, w: barW });
      currentX += barW + spaceW;
    }

    // Guard bars at end
    pattern.push({ x: width - 16, w: 2 });
    pattern.push({ x: width - 12, w: 2 });

    return pattern;
  }, [value, width]);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <rect width={width} height={height} fill="#FFFFFF" />
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={4}
            width={bar.w}
            height={height - 8}
            fill="#0F172A"
            rx={0.5}
          />
        ))}
      </svg>
      <span className="font-mono text-[10px] tracking-widest text-slate-500 mt-1 font-bold">
        {value}
      </span>
    </div>
  );
};
