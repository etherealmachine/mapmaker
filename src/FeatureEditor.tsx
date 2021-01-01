import React, { useContext, useState } from 'react';

import DescriptionEditor from './DescriptionEditor';
import { Context } from './State';

export default function FeatureEditor() {
  const appState = useContext(Context);
  const selection = appState.getSelectedFeature();
  const [lastSelection, setLastSelection] = useState(appState.selection);
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const [tmpDescription, setTmpDescription] = useState<string | undefined>(undefined);
  const onSave = () => {
    appState.setFeatureDescription({
      name: tmpName === undefined ? selection?.feature.properties.name : tmpName,
      description: tmpDescription === undefined ? selection?.feature.properties.description : tmpDescription
    });
    setTmpName(undefined);
    setTmpDescription(undefined);
  };
  if (appState.selection.levelIndex !== lastSelection.levelIndex || appState.selection.featureIndex !== lastSelection.featureIndex) {
    setLastSelection(appState.selection);
    setTmpName(undefined);
    setTmpDescription(undefined);
  }
  const onUndo = () => {
    if (!selection) return;
    if (selection.feature.properties.name) setTmpName(selection.feature.properties.name);
    if (selection.feature.properties.description) setTmpDescription(selection.feature.properties.description);
  };
  const onDelete = () => {
    appState.handleDelete();
  }
  let name = tmpName || '';
  if (tmpName === undefined && selection?.feature.properties.name !== undefined) {
    name = selection?.feature.properties.name;
  }
  let description = tmpDescription || '';
  if (tmpDescription === undefined && selection?.feature.properties.description !== undefined) {
    description = selection?.feature.properties.description;
  }
  return <div>
    <h3 style={{ color: 'white' }}>Area</h3>
    <DescriptionEditor
      name={name}
      description={description}
      onNameChange={setTmpName}
      onDescriptionChange={setTmpDescription}
      onSave={onSave}
      onUndo={onUndo}
      onDelete={onDelete}
    />
  </div>;
}