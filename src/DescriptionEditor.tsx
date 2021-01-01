import React from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';

import { DS } from './design_system';
import Description from './Description';

const classes = css`
  .editor {
    display: flex;
    flex-direction: column;
  }
  .editor textarea {
    height: 400px;
    outline: none;
    border: none;
  }
  .name {
    font-family: Helvetica serif;
    font-size: 24px;
    color: white;
    padding: 8px;
  }
  .actions {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 12px 24px;
  }
`;

interface Props {
  name: string
  description: string
  onNameChange(name: string): void
  onDescriptionChange(text: string): void
  onSave(): void
  onUndo(): void
  onDelete?: () => void
}

export default function DescriptionEditor(props: Props) {
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onNameChange(event.target.value);
  };
  const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    props.onDescriptionChange(event.target.value);
  };
  return <div className={classes.editor}>
    <div style={{ display: 'flex', alignContent: 'center' }}>
      <input className={DS.input} style={{ flexGrow: 1 }} value={props.name || ''} onChange={onNameChange} />
    </div>
    <textarea
      value={props.description || ''}
      onChange={onTextChange} />
    <div className={classes.actions}>
      {<button className={DS.button} onClick={props.onSave}>Save</button>}
      {<button className={classNames(DS.button)} onClick={props.onUndo}>Undo</button>}
      {props.onDelete && <button className={classNames(DS.button, DS.danger)} onClick={props.onDelete}>Delete</button>}
    </div>
    <Description name={props.name} text={props.description} />
  </div>;
}