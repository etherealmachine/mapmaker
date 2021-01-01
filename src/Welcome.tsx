import React from 'react';
import { css } from 'astroturf';
import { faCaretLeft, faDoorClosed, faSquare, faVectorSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { statueIcon } from './icons/custom_icons';

const classes = css`
  .welcomePage {
    display: flex;
    flex-direction: column;
  }
  .welcomePage a {
    color: white;
  }
  .welcomePage li {
    padding: 4px;
  }
  .footer {
    font-size: 16px;
    margin-left: auto;
    margin-right: auto;
  }
`;

export default function Welcome() {
  return <div className={classes.welcomePage}>
    <h2>Welcome to the RPG.ai Mapmaker</h2>
    <h3>Quick Start</h3>
    <ul>
      <li>Use the scroll wheel or hold space to scroll around</li>
      <li>Select the Wall tool (<FontAwesomeIcon icon={faSquare} />) to build walls</li>
      <li>Select the Rect tool (<FontAwesomeIcon icon={faVectorSquare} />) for rectangular areas</li>
      <li>Place Decorations (<FontAwesomeIcon icon={statueIcon} />) and Doors (<FontAwesomeIcon icon={faDoorClosed} />) </li>
      <li>Select and Annotate your areas (checkout the Drawer <FontAwesomeIcon icon={faCaretLeft} /> on the right)</li>
      <li>Click "Print" and print your map as a PDF</li>
    </ul>
    <h3>Support</h3>
    <ul>
      <li>File bugs at <a href="https://github.com/etherealmachine/rpg-ai/issues">Github Issues</a></li>
      <li>If you like the project, or want more features, support development on <a href="https://www.patreon.com/etherealmachine">Patreon</a></li>
    </ul>
    <p className={classes.footer}>Developed by <a href="https://github.com/etherealmachine">@etherealmachine</a>, Copyright 2020</p>
  </div>;
}