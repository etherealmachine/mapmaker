import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { css } from 'astroturf';
import {
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

const classes = css`
  .modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .modalContent {
    position: relative;
    background-color: #373737;
    color: #fff;
    margin: 64px auto;
    padding: 0 20px 20px 20px;
    border: 1px solid #888;
    border-radius: 8px;
    width: 60%;
  }

  .modalContent button {
    outline: none;
    border: none;
    background-color: transparent;
    color: #fff;
    font-size: 24px;
    position: absolute;
    top: 8px;
    right: 8px;
    text-decoration: none;
    cursor: pointer;
  }
`;

export default function Modal(props: React.PropsWithChildren<{ open: boolean, toggle: () => void }>) {
  return <div className={classes.modal} style={{ display: props.open ? 'block' : 'none' }}>
    <div className={classes.modalContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={props.toggle}><FontAwesomeIcon icon={faTimes} /></button>
      </div>
      {props.children}
    </div>
  </div>;
}