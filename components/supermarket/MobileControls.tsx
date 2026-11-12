'use client';

import { useEffect, useState } from 'react';

interface ControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  interact: boolean;
}

export function MobileControls({ onChange }: { onChange: (state: ControlsState) => void }) {
  const [state, setState] = useState<ControlsState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    rotateLeft: false,
    rotateRight: false,
    interact: false,
  });

  useEffect(() => {
    onChange(state);
  }, [state, onChange]);

  const setField = (field: keyof ControlsState, value: boolean) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handlers = (field: keyof ControlsState) => ({
    onMouseDown: () => setField(field, true),
    onMouseUp: () => setField(field, false),
    onMouseLeave: () => setField(field, false),
    onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setField(field, true);
    },
    onTouchEnd: () => setField(field, false),
    onTouchCancel: () => setField(field, false),
    onPointerLeave: () => setField(field, false),
    onPointerUp: () => setField(field, false),
    onPointerCancel: () => setField(field, false),
  });

  return (
    <div className="mobile-controls">
      <div className="mobile-nav">
        <button className="mobile-btn mobile-btn--rotate" type="button" aria-label="Rotate camera left" {...handlers('rotateLeft')}>↺</button>
        <button className="mobile-btn mobile-btn--rotate" type="button" aria-label="Rotate camera right" {...handlers('rotateRight')}>↻</button>
        <div className="mobile-move">
          <button className="mobile-btn" type="button" aria-label="Forward" {...handlers('forward')}>▲</button>
          <div className="mobile-row">
            <button className="mobile-btn" type="button" aria-label="Left" {...handlers('left')}>◄</button>
            <button className="mobile-btn" type="button" aria-label="Backward" {...handlers('backward')}>▼</button>
            <button className="mobile-btn" type="button" aria-label="Right" {...handlers('right')}>►</button>
          </div>
        </div>
        <button className="mobile-btn" type="button" aria-label="Inspect product" {...handlers('interact')}>Tap</button>
      </div>
    </div>
  );
}