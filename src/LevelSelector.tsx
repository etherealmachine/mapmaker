import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { css } from 'astroturf';
import {
  faPlus,
  faMinus,
} from '@fortawesome/free-solid-svg-icons'

import { Context } from './State';
import classNames from 'classnames';

const classes = css`
  .levels {
    display: flex;
    flex-direction: column;
    position: absolute;
    bottom: 0;
    left: 0;
    background: #000;
    border-radius: 12px;
    margin-bottom: 50px;
    margin-left: 24px;
    padding: 8px;
    box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.2);
    color: white;
  }
  .levels svg {
    color: white;
    font-size: 12px;
  }
  .levels button {
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
  .levels button:hover {
    background: #505050;
    box-shadow: -2px -2px 8px rgba(255, 255, 255, 0.9), 2px 2px 8px rgba(255, 255, 255, 0.9);
  }
  .levels button:active {
    outline: none;
    border: none;
    scale: 0.9;
  }
  .levels button.selected {
    color: black;
    background: #bbb;
    box-shadow: -1px -1px 8px rgba(255, 255, 255, 0.5), 1px 1px 8px rgba(255, 255, 255, 0.5);
  }
  .levels h4 {
    margin: 0;
    padding: 0;
  }
  .level {
    display: flex;
    align-items: center;
  }
  button.link {
    outline: none;
    border: none;
  }
  .link:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`;

export default function Levels() {
  const state = useContext(Context);
  const isGhostLevel = (i: number) => {
    return state.selection.ghostLevels[i];
  };
  const setGhostLevel = (i: number, newValue: boolean) => {
    state.setSelection({
      ...state.selection,
      ghostLevels: {
        ...state.selection.ghostLevels,
        [i]: newValue,
      }
    });
  };
  return <div className={classes.levels}>
    <h4>Levels</h4>
    {state.maps[state.selection.mapIndex].levels.map((level, i) => <div key={i} className={classes.level}>
      <button
        className={classNames(classes.link, state.selection.levelIndex === i && classes.selected)}
        onClick={() => state.selectLevel(i)}>
        {i}
      </button>
      <button onClick={() => state.removeLevel(i)}><FontAwesomeIcon icon={faMinus} /></button>
      <input
        type="checkbox"
        checked={isGhostLevel(i)}
        onChange={e => setGhostLevel(i, e.target.checked)}
      />
    </div>)}
    <button onClick={() => state.addLevel()}><FontAwesomeIcon icon={faPlus} /></button>
  </div>;
}