import { useState, useEffect } from 'react';

export function useMasonryColumns(
  breakpoints: { minWidth: number; columns: number }[]
): number {
  const getColumns = () => {
    const width = window.innerWidth;
    // Find the last breakpoint that matches
    let cols = breakpoints[0].columns;
    for (const bp of breakpoints) {
      if (width >= bp.minWidth) cols = bp.columns;
    }
    return cols;
  };

  const [columns, setColumns] = useState(getColumns);

  useEffect(() => {
    const handler = () => setColumns(getColumns());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return columns;
}
