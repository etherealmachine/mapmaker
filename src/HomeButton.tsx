import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { css } from 'astroturf';
import {
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons'

import { Context } from './State';

const classes = css`
  .home {
    display: flex;
    flex-direction: column;
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 8px;
    z-index: 1;
  }
  .home svg {
    color: #505050;
    font-size: 24px;
  }
  .home button {
    background: transparent;
    outline: none;
    border: none; 
    display: flex;
    margin: 2px;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }
  .home button:hover svg {
    color: #000;
  }
`;

export default function HomeButton() {
  const state = useContext(Context);
  return <div className={classes.home}>
    <button onClick={() => state.setZoom(1, [0, 0])}><FontAwesomeIcon icon={faMapMarkerAlt} /></button>
  </div>;
}