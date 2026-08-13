import { useState, useEffect, useRef } from 'react';

export function useInView(options: IntersectionObserverInit = { threshold: 0.1 }) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<Element | null>(null);
  const { threshold, root, rootMargin } = options;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { threshold, root, rootMargin });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, root, rootMargin]);

  return { ref, isInView };
}
