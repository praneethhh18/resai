
'use client';

import { useMemo, type DependencyList } from 'react';

/**
 * A custom hook that memoizes a value and marks it as a memoized Firebase query.
 * This is a workaround to enforce proper memoization for Firestore hooks
 * and prevent infinite re-render loops.
 *
 * @param factory The function that creates the value.
 * @param deps The dependency array for the memoization.
 * @returns The memoized value, with a `__memo` property attached.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedValue = useMemo(factory, deps);

  // Attach a non-enumerable property to mark this value as memoized.
  // This is for internal checks within data hooks like useCollection/useDoc.
  if (memoizedValue && typeof memoizedValue === 'object') {
    Object.defineProperty(memoizedValue, '__memo', {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  return memoizedValue;
}
