import React, { useContext, useState } from 'react';

import DescriptionEditor from './DescriptionEditor';
import { Context } from './State';

export default function MapEditor() {
  const appState = useContext(Context);
  const map = appState.maps[appState.selection.mapIndex];
  const [lastSelection, setLastSelection] = useState(appState.selection);
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const [tmpDescription, setTmpDescription] = useState<string | undefined>(undefined);
  const onSave = () => {
    appState.setMapDescription({
      name: tmpName === undefined ? map.name : tmpName,
      description: tmpDescription === undefined ? map.description : tmpDescription
    });
    setTmpName(undefined);
    setTmpDescription(undefined);
  };
  if (appState.selection.mapIndex !== lastSelection.mapIndex) {
    setLastSelection(appState.selection);
    setTmpName(undefined);
    setTmpDescription(undefined);
  }
  const onUndo = () => {
    setTmpName(map.name);
    setTmpDescription(map.description);
  };
  let name = tmpName || '';
  if (tmpName === undefined) name = map.name || '';
  let description = tmpDescription || '';
  if (tmpDescription === undefined) description = map.description || '';
  return <div>
    <h3 style={{ color: 'white' }}>Map</h3>
    <DescriptionEditor
      name={name}
      description={description}
      onNameChange={setTmpName}
      onDescriptionChange={setTmpDescription}
      onSave={onSave}
      onUndo={onUndo}
    /></div>;
}