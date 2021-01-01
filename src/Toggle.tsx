import React from 'react';
import { css } from 'astroturf';

const classes = css`
  .toggle {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 34px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
    border-radius: 50%;
  }

  .toggle input:checked + .slider {
    background-color: #2196F3;
  }

  .toggle input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
  }

  .toggle input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }
`;

export default function Toggle(props: { toggled: boolean, onToggle: () => void }) {
  return <label className={classes.toggle}>
    <input type="checkbox" checked={props.toggled} onChange={props.onToggle} />
    <span className={classes.slider}></span>
  </label>;
}