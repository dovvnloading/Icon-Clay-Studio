
import { CanvasElement, Guide } from '../types';

/**
 * Calculates the Axis-Aligned Bounding Box (AABB) of a potentially rotated element.
 */
export const getElementBounds = (el: CanvasElement) => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  if (el.rotation === 0) {
    return {
      left: el.x,
      right: el.x + el.width,
      top: el.y,
      bottom: el.y + el.height
    };
  }

  const rad = (el.rotation * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);

  const p1 = { x: -el.width / 2, y: -el.height / 2 };
  const p2 = { x: el.width / 2, y: -el.height / 2 };
  const p3 = { x: el.width / 2, y: el.height / 2 };
  const p4 = { x: -el.width / 2, y: el.height / 2 };

  const rotate = (p: { x: number; y: number }) => ({
    x: cx + (p.x * c - p.y * s),
    y: cy + (p.x * s + p.y * c)
  });

  const pp1 = rotate(p1);
  const pp2 = rotate(p2);
  const pp3 = rotate(p3);
  const pp4 = rotate(p4);

  const xs = [pp1.x, pp2.x, pp3.x, pp4.x];
  const ys = [pp1.y, pp2.y, pp3.y, pp4.y];

  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys)
  };
};

/**
 * Generates an SVG path string for a Squircle (Superellipse approximation).
 */
export const getSquirclePath = (w: number, h: number) => {
    // Approximation of a squircle using cubic bezier curves.
    // Normalized for 100x100
    // M 50 0 C 90 0 100 10 100 50 C 100 90 90 100 50 100 C 10 100 0 90 0 50 C 0 10 10 0 50 0 Z
    // Scaled to w, h
    return `
      M ${w * 0.5},0
      C ${w * 0.9},0 ${w},${h * 0.1} ${w},${h * 0.5}
      C ${w},${h * 0.9} ${w * 0.9},${h} ${w * 0.5},${h}
      C ${w * 0.1},${h} 0,${h * 0.9} 0,${h * 0.5}
      C 0,${h * 0.1} ${w * 0.1},0 ${w * 0.5},0
      Z
    `;
};

/**
 * Calculates smart guides for snapping an element to the canvas center or other elements.
 */
export const calculateSmartGuides = (
  currentRect: { x: number; y: number; width: number; height: number },
  otherElements: CanvasElement[],
  canvasSize: { width: number; height: number },
  zoom: number,
  snapThreshold: number = 5
) => {
  const guides: Guide[] = [];
  const threshold = snapThreshold / zoom;

  const current = {
    l: currentRect.x,
    c: currentRect.x + currentRect.width / 2,
    r: currentRect.x + currentRect.width,
    t: currentRect.y,
    m: currentRect.y + currentRect.height / 2,
    b: currentRect.y + currentRect.height,
  };

  const targetsX: { val: number; isCenter: boolean }[] = [
    { val: 0, isCenter: false },
    { val: canvasSize.width / 2, isCenter: true },
    { val: canvasSize.width, isCenter: false }
  ];
  const targetsY: { val: number; isCenter: boolean }[] = [
    { val: 0, isCenter: false },
    { val: canvasSize.height / 2, isCenter: true },
    { val: canvasSize.height, isCenter: false }
  ];

  otherElements.forEach(el => {
    if (!el.visible || el.type === 'folder') return;
    targetsX.push(
      { val: el.x, isCenter: false },
      { val: el.x + el.width / 2, isCenter: true },
      { val: el.x + el.width, isCenter: false }
    );
    targetsY.push(
      { val: el.y, isCenter: false },
      { val: el.y + el.height / 2, isCenter: true },
      { val: el.y + el.height, isCenter: false }
    );
  });

  let snapDx = 0;
  let snapDy = 0;
  let snappedX = false;

  const checkSnapX = (currentVal: number, targetVal: number, isCenter: boolean) => {
    if (Math.abs(currentVal - targetVal) < threshold) {
      snapDx = targetVal - currentVal;
      guides.push({ type: 'vertical', position: targetVal, isCenter });
      return true;
    }
    return false;
  };

  for (const t of targetsX) {
    if (snappedX) break;
    if (checkSnapX(current.c, t.val, t.isCenter)) { snappedX = true; break; }
    if (checkSnapX(current.l, t.val, t.isCenter)) { snappedX = true; break; }
    if (checkSnapX(current.r, t.val, t.isCenter)) { snappedX = true; break; }
  }

  let snappedY = false;
  const checkSnapY = (currentVal: number, targetVal: number, isCenter: boolean) => {
    if (Math.abs(currentVal - targetVal) < threshold) {
      snapDy = targetVal - currentVal;
      guides.push({ type: 'horizontal', position: targetVal, isCenter });
      return true;
    }
    return false;
  };

  for (const t of targetsY) {
    if (snappedY) break;
    if (checkSnapY(current.m, t.val, t.isCenter)) { snappedY = true; break; }
    if (checkSnapY(current.t, t.val, t.isCenter)) { snappedY = true; break; }
    if (checkSnapY(current.b, t.val, t.isCenter)) { snappedY = true; break; }
  }

  return { snapDx, snapDy, guides };
};
