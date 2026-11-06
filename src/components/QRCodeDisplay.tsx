import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

// Generates an authentic matrix pattern based on the value string
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 160 }) => {
  // Generate deterministic 21x21 QR-like matrix
  const matrixSize = 25;
  
  // Deterministic pseudo-random generator seeded by value
  const getMatrix = (seedStr: string) => {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }

    const grid: boolean[][] = Array(matrixSize).fill(false).map(() => Array(matrixSize).fill(false));

    // Fill corner positioning squares (7x7)
    const drawCorner = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner core
          ) {
            grid[startRow + r][startCol + c] = true;
          }
        }
      }
    };

    drawCorner(0, 0); // Top-left
    drawCorner(0, matrixSize - 7); // Top-right
    drawCorner(matrixSize - 7, 0); // Bottom-left

    // Timing patterns
    for (let i = 8; i < matrixSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Fill data area pseudorandomly based on seed
    let prng = Math.abs(hash);
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip corner targets
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= matrixSize - 8;
        const inBottomLeft = r >= matrixSize - 8 && c < 8;
        const isTiming = r === 6 || c === 6;

        if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
          prng = (prng * 16807 + 11) % 2147483647;
          grid[r][c] = (prng % 100) > 44;
        }
      }
    }

    return grid;
  };

  const matrix = getMatrix(value);
  const cellSize = size / matrixSize;

  return (
    <div 
      className="p-3 bg-white rounded-xl shadow-lg inline-block border-2 border-yellow-400/40 relative"
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full block"
      >
        {matrix.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0F172A"
                rx={cellSize > 5 ? 1 : 0.5}
              />
            ) : null
          )
        )}
      </svg>
      {/* ID06 Center Badge */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-[#0F172A] border-2 border-yellow-400 text-yellow-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow">
          ID06
        </div>
      </div>
    </div>
  );
};
