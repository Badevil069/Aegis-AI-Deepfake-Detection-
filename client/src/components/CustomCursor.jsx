import { useEffect, useRef, useCallback } from 'react';

export default function CustomCursor() {
  const auraRef = useRef(null);
  const dotRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const auraPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const animate = useCallback(() => {
    const dx = mousePos.current.x - auraPos.current.x;
    const dy = mousePos.current.y - auraPos.current.y;
    auraPos.current.x += dx * 0.15;
    auraPos.current.y += dy * 0.15;

    if (auraRef.current) {
      auraRef.current.style.left = `${auraPos.current.x}px`;
      auraRef.current.style.top = `${auraPos.current.y}px`;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  // Continuously re-bind hover listeners as DOM changes (route transitions, etc.)
  useEffect(() => {
    const handleEnter = () => document.body.classList.add('cursor-hover');
    const handleLeave = () => document.body.classList.remove('cursor-hover');

    const bindAll = () => {
      document.querySelectorAll('a, button, .interactive').forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
        el.addEventListener('mouseenter', handleEnter);
        el.addEventListener('mouseleave', handleLeave);
      });
    };

    // Bind on mount
    bindAll();

    // Re-bind whenever DOM changes (route navigations, dynamic content)
    const observer = new MutationObserver(bindAll);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.querySelectorAll('a, button, .interactive').forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, []);

  return (
    <>
      <div ref={auraRef} id="cursor-aura" />
      <div ref={dotRef} id="cursor-dot" />
    </>
  );
}
