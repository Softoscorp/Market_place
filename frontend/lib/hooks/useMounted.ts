import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/** Returns true only after the component has mounted on the client (false during SSR/prerender). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}