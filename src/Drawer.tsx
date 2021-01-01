import React, { useContext, useRef } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

import FeatureEditor from './FeatureEditor';
import LevelEditor from './LevelEditor';
import MapEditor from './MapEditor';
import { Context } from './State';

const classes = css`
  .drawer {
    width: 0;
    margin: 8px 0;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    background: #373737;
    box-sizing: border-box;
    transition: .2s ease-out;
    &.open {
      transition: .2s ease-out;
      z-index: 100;
    }
  }
  .toggleButton {
    position: absolute;
    top: 0;
    left: -27px;
    background: #373737;
    color: white;
    outline: none;
    border: none;
    font-size: 30px;
    padding: 8px;
    border-radius: 4px 0 0 4px;
  }
  .editors {
    height: 97%;
    overflow: scroll;
    padding: 8px;
  }
`;

export default function Drawer() {
  const appState = useContext(Context);
  const selection = appState.getSelectedFeature();
  const drawerRef = useRef<HTMLDivElement>(null);
  const onMouseMove = (e: MouseEvent) => {
    if (e.buttons !== 1) {
      document.removeEventListener('mousemove', onMouseMove);
      return;
    }
    if (!drawerRef.current) return;
    const drag = drawerRef.current.dataset.drag;
    if (drag) {
      const width = parseInt(drawerRef.current.style.width.replace('px', ''));
      drawerRef.current.style.width = `${width + (parseInt(drag) - e.screenX)}px`;
    }
    drawerRef.current.dataset.drag = e.screenX.toString();
  }
  const onClick = () => {
    if (!drawerRef.current) return;
    if (drawerRef.current.dataset.drag) {
      drawerRef.current.dataset.drag = '';
      return;
    }
    appState.setDrawerOpen(!appState.drawerOpen);
  }
  const onMouseDown = (e: React.MouseEvent) => {
    document.addEventListener('mousemove', onMouseMove);
    if (!drawerRef.current) return;
    drawerRef.current.dataset.dragStart = e.screenX.toString();
  }
  const onMouseUp = (e: React.MouseEvent) => {
    document.removeEventListener('mousemove', onMouseMove);
    if (!drawerRef.current) return;
    const dragStart = drawerRef.current.dataset.dragStart;
    if (dragStart) {
      if (Math.abs(parseInt(dragStart) - e.screenX) < 10) {
        drawerRef.current.dataset.drag = '';
      }
    }
    const width = parseInt(drawerRef.current.style.width.replace('px', ''));
    if (width > 100) {
      appState.setDrawerWidth(width);
      appState.setDrawerOpen(true);
    }
  }
  return <div
    ref={drawerRef}
    className={classNames(classes.drawer, appState.drawerOpen && classes.open)}
    style={{ width: appState.drawerOpen ? `${appState.drawerWidth}px` : 0 }}>
    <button
      className={classNames(classes.toggleButton, appState.drawerOpen && classes.open)}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}>
      {appState.drawerOpen && <FontAwesomeIcon icon={faCaretRight} />}
      {!appState.drawerOpen && <FontAwesomeIcon icon={faCaretLeft} />}
    </button>
    <div className={classes.editors}>
      <MapEditor />
      <LevelEditor />
      {selection && <FeatureEditor />}
    </div>
  </div>;
}