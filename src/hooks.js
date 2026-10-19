import React from 'react';
const { useEffect, useRef, useState, useCallback } = React;

/* Width of an element, kept current. */
export function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(es => { for (const e of es) setW(e.contentRect.width); });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* Draw an ImageData (optionally washed toward white) into a canvas element. */
export function useImageCanvas(img, wash = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !img) return;
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.putImageData(img, 0, 0);
    if (wash) { x.fillStyle = `rgba(255,255,255,${wash})`; x.fillRect(0, 0, c.width, c.height); }
  }, [img, wash]);
  return ref;
}

/* localStorage that never throws. */
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* unavailable */ } },
};

export function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef(0);
  const show = useCallback(m => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2600); }, []);
  return [msg, show];
}

export const idle = () => new Promise(r => setTimeout(r, 0));

/* Whether a media query matches, kept current. */
export function useMedia(q) {
  const get = () => (typeof matchMedia !== 'undefined' ? matchMedia(q).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return undefined;
    const mq = matchMedia(q), on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}
