import React, { useEffect, useRef, useState } from 'react';
import { createPopper } from '@popperjs/core';
import { css } from 'astroturf';

const classes = css`
  .tooltip {
    color: white;
    background: black;
    border-radius: 4px;
    padding: 8px;
  }
`;

export default function Tooltip(props: React.PropsWithChildren<{ tooltip: string }>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  const show = () => {
    setShown(true);
  };
  const hide = () => {
    setShown(false);
  }
  useEffect(() => {
    if (parentRef.current && tooltipRef.current) {
      createPopper(parentRef.current, tooltipRef.current, {
        placement: 'right',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 20],
            },
          },
        ],
      });
    }
    if (hoverRef.current) {
      hoverRef.current.addEventListener('mouseenter', show);
      hoverRef.current.addEventListener('mouseleave', hide);
    }
  }, [parentRef, tooltipRef]);
  return <div ref={parentRef}>
    <span
      ref={tooltipRef}
      style={shown ? {} : { visibility: 'hidden' }}
      className={classes.tooltip}>
      {props.tooltip}
    </span>
    <div ref={hoverRef}>
      {props.children}
    </div>
  </div>;
}