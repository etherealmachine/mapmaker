import React, { useContext, useState } from 'react';
import { css } from 'astroturf';
import { useHistory } from "react-router-dom";

import Modal from './Modal';
import { DS } from './design_system';
import { Context } from './State';

const classes = css`
  .menubar {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: #373737;
    padding: 2px;
    width: 100%;
  }
  .title {
    color: white;
    margin: 8px 24px 8px 24px;
  }
  .debugMenu {
    margin-left: auto;
    margin-right: 24px;
  }
  label {
    color: white;
  }
  .mapLink:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

function MapSelector(props: { onSelect: (map: number) => void }) {
  const appState = useContext(Context);
  return <div>
    <h2>Maps</h2>
    <div>{
      appState.maps.map((map, i) => <div key={i}>
        <h4
          className={classes.mapLink}
          onClick={() => props.onSelect(i)}>
          {map.name}
        </h4>
      </div>)
    }</div>
  </div>
}

export default function Menubar() {
  const appState = useContext(Context);
  const history = useHistory();
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const updateTmpName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTmpName(event.target.value);
  }
  const name = tmpName === undefined ? appState.maps[appState.selection.mapIndex].name : tmpName;
  const [showLoadModal, setShowLoadModal] = useState(false);
  const selectMap = (i: number) => {
    appState.setSelection({
      mapIndex: i,
      levelIndex: 0,
      featureIndex: undefined,
      geometryIndex: undefined,
      ghostLevels: {},
    });
    setShowLoadModal(false);
  }
  const [lastSelection, setLastSelection] = useState(appState.selection);
  if (appState.selection.mapIndex !== lastSelection.mapIndex || appState.selection.mapIndex !== lastSelection.mapIndex) {
    setLastSelection(appState.selection);
    setTmpName(undefined);
  }
  return <React.Fragment>
    <div className={classes.menubar}>
      <span className={classes.title}>RPG.ai</span>
      <input className={DS.input} value={name} onChange={updateTmpName} />
      <button
        className={DS.buttonSmall}
        onClick={() => { appState.save(name || ''); }}>
        Save
      </button>
      {appState.maps.length > 1 && <button
        className={DS.buttonSmall}
        onClick={() => { setShowLoadModal(true); }}>
        Load
      </button>}
      <button
        className={DS.buttonSmall}
        onClick={() => { appState.newMap(); }}>
        New
      </button>
      <button
        className={DS.buttonSmall}
        onClick={() => { appState.undo(); }}>
        Undo
      </button>
      <button
        className={DS.buttonSmall}
        onClick={() => { appState.redo(); }}>
        Redo
      </button>
      <button
        className={DS.buttonSmall}
        onClick={() => { history.push('/print'); }}>
        Print
      </button>
      <button
        className={DS.buttonSmall}
        onClick={() => { appState.toggleWelcome(); }}>
        Help
      </button>
      {appState.debug && <div>
        <button
          className={DS.buttonSmall}
          onClick={() => { appState.export(); }}>
          Export
      </button>
        <button
          className={DS.buttonSmall}
          onClick={() => { appState.reset(); }}>
          Clear
      </button>
      </div>}
      <div className={classes.debugMenu}>
        <label>Debug</label>
        <input
          type="checkbox"
          checked={appState.debug}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => appState.setDebug(event.target.checked)} />
      </div>
    </div>
    {showLoadModal && <Modal open={showLoadModal} toggle={() => setShowLoadModal(!showLoadModal)}>
      <MapSelector onSelect={selectMap} />
    </Modal>}
  </React.Fragment>;
}