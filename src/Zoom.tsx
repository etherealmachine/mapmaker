import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { css } from 'astroturf';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

import { DS } from './design_system';
import { Context } from './State';
import { clamp } from './lib';
import { CanvasRenderer } from './Canvas';

const classes = css`
  .zoom button {
    background: black;
    width: 24px;
    height: 24px;
    border: 1px solid white;
    outline: none;
    margin: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  .zoom svg {
    color: white;
    font-size: 12px;
  }
  .zoom button:hover {
    background: #505050;
    box-shadow: -2px -2px 8px rgba(255, 255, 255, 0.9), 2px 2px 8px rgba(255, 255, 255, 0.9);
  }
  .zoom button:active {
    outline: none;
    border: none;
    scale: 0.9;
  }
`;

export default function Zoom(props: { renderer?: CanvasRenderer }) {
  const state = useContext(Context);
  const zoom = (mult: number) => () => {
    const renderer = props.renderer;
    if (!renderer) return;
    const { scale, offset } = state;
    const newScale = clamp(scale * mult, 0.2, 4);
    const mid = [renderer.canvas.width / 2, renderer.canvas.height / 2];
    const worldPos = renderer.canvasToWorld(mid);
    const newWorldPos = [mid[0] / newScale - offset[0], mid[1] / newScale - offset[1]];
    const newOffset = [
      offset[0] - (worldPos[0] - newWorldPos[0]),
      offset[1] - (worldPos[1] - newWorldPos[1])
    ];
    window.requestAnimationFrame(() => {
      state.setZoom(newScale, newOffset);
    });
  }
  return <div className={classNames(DS.toolbar, classes.zoom)} style={{ position: 'absolute', top: '50px', right: '50px' }}>
    <button onClick={zoom(1.1)}><FontAwesomeIcon icon={faPlus}></FontAwesomeIcon></button>
    <button onClick={zoom(0.9)}><FontAwesomeIcon icon={faMinus}></FontAwesomeIcon></button>
  </div>;
}