import React, { CSSProperties, useContext, useState } from 'react';
import { css } from 'astroturf';
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

import DescriptionEditor from './DescriptionEditor';
import { Context } from './State';

const classes = css`
  .features {
    font-family: Helvetica serif;
    font-size: 18px;
    color: white;
    padding: 8px;
  }
`;

const getItemStyle = (isDragging: boolean, isSelected: boolean, draggableStyle: CSSProperties): CSSProperties => ({
  userSelect: 'none',
  padding: '4px',
  margin: '0',
  background: '#373737',
  textDecoration: isSelected ? 'underline' : '',
  ...draggableStyle
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: '#373737',
  padding: '4px',
  width: '250px'
});

export default function LevelEditor() {
  const appState = useContext(Context);
  const level = appState.maps[appState.selection.mapIndex].levels[appState.selection.levelIndex];
  const [lastSelection, setLastSelection] = useState(appState.selection);
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const [tmpDescription, setTmpDescription] = useState<string | undefined>(undefined);
  const onSave = () => {
    appState.setLevelDescription({
      name: tmpName === undefined ? level.name : tmpName,
      description: tmpDescription === undefined ? level.description : tmpDescription
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
    setTmpName(level.name);
    setTmpDescription(level.description);
  };
  const namedFeatures = level.features.map((feature, i) => ({ index: i, feature })).filter(f => f.feature.properties.name);
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    appState.setFeatureOrder(
      namedFeatures[result.source.index].index,
      namedFeatures[result.destination.index].index);
  };
  const onFeatureSelected = (i: number) => () => {
    appState.setSelection({
      ...appState.selection,
      featureIndex: i,
      geometryIndex: 0,
    });
  }
  let name = tmpName || '';
  if (tmpName === undefined) name = level.name || '';
  let description = tmpDescription || '';
  if (tmpDescription === undefined) description = level.description || '';
  return <div>
    <h3 style={{ color: 'white' }}>Level</h3>
    <DescriptionEditor
      name={name}
      description={description}
      onNameChange={setTmpName}
      onDescriptionChange={setTmpDescription}
      onSave={onSave}
      onUndo={onUndo}
    />
    <div className={classes.features}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={getListStyle(snapshot.isDraggingOver)}
            >
              {namedFeatures.map((f, i) => (
                <Draggable key={i} draggableId={i.toString()} index={i}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={onFeatureSelected(f.index)}
                      style={getItemStyle(
                        snapshot.isDragging,
                        appState.getSelectedFeature()?.feature === f.feature,
                        provided.draggableProps.style || {}
                      )}>
                      {`${i + 1}. ${f.feature.properties.name}`}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  </div>;
}