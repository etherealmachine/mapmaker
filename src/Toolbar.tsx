import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import {
  faMousePointer,
  faVectorSquare,
  faDrawPolygon,
  IconDefinition,
  faDoorClosed,
  faSquare,
  faBrush,
  faStrikethrough,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons'

import { DS } from './design_system';
import { Context, ToolName } from './State';
import Tooltip from './Tooltip';
import Toggle from './Toggle';
import { columnIcon, stairsIcon, stalacmiteIcon, statueIcon } from './icons/custom_icons';
import { faCircle } from '@fortawesome/free-regular-svg-icons';

interface Button {
  icon?: IconDefinition
  tooltip: string,
  options?: { [key: string]: Button }
}

const buttons: { [key in ToolName]: Button } = {
  'pointer': { icon: faMousePointer, tooltip: 'Select' },
  'walls': { icon: faSquare, tooltip: 'Walls' },
  'stairs': { icon: stairsIcon, tooltip: 'Stairs' },
  'doors': {
    tooltip: 'Doors', options: {
      'normal': { icon: faDoorClosed, tooltip: 'Normal Door' },
      'secret': { icon: faStrikethrough, tooltip: 'Secret Door' },
    }
  },
  'decoration': {
    tooltip: 'Decorations', options: {
      'statue': { icon: statueIcon, tooltip: 'Statue' },
      'column': { icon: columnIcon, tooltip: 'Column' },
      'stalacmite': { icon: stalacmiteIcon, tooltip: 'Stalacmite' },
    }
  },
  'brush': { icon: faBrush, tooltip: 'Paint' },
  'rect': { icon: faVectorSquare, tooltip: 'Rectangle' },
  'polygon': { icon: faDrawPolygon, tooltip: 'Polygon' },
  'ellipse': { icon: faCircle, tooltip: 'Circle/Ellipse' },
};

export default function Toolbar() {
  const state = useContext(Context);
  const handleButtonClick = (tool: ToolName) => () => {
    state.setSelectedTool(tool);
  };
  const toggleGridSteps = () => {
    state.setGridSteps(state.gridSteps === 1 ? 2 : 1);
  };
  const isOptionSelected = (tool: ToolName, option: string) => {
    if (state.tools[tool].hasOwnProperty('subtype')) {
      return (state.tools[tool] as any).subtype === option;
    }
    return false;
  };
  const handleOptionClick = (tool: ToolName, option: string) => () => {
    state.setToolOption(tool, option);
  };
  const iconFor = (tool: ToolName) => {
    const button = buttons[tool];
    if (button?.options) return button.options[(state.tools[tool] as any).subtype].icon || faExclamationTriangle;
    return button?.icon || faExclamationTriangle;
  }
  return <div className={DS.toolbar} style={{ position: 'absolute', top: '50px', left: '24px' }}>
    {Object.entries(state.tools).map(([name, spec]) => <Tooltip key={name} tooltip={buttons[name as ToolName]?.tooltip}>
      <React.Fragment>
        <button
          className={spec.selected ? DS.selected : ''}
          disabled={spec.disabled}
          onClick={handleButtonClick(name as ToolName)}>
          <FontAwesomeIcon icon={iconFor(name as ToolName)} />
        </button>
        {spec.selected && buttons[name as ToolName].options && <div className={DS.toolbar}>
          {Object.entries(buttons[name as ToolName].options || {}).map(([optionName, optionSpec]) => <Tooltip key={optionName} tooltip={optionSpec.tooltip}>
            <button className={isOptionSelected(name as ToolName, optionName) ? DS.selected : ''}
              onClick={handleOptionClick(name as ToolName, optionName)}>
              <FontAwesomeIcon icon={optionSpec.icon || faExclamationTriangle} />
            </button>
          </Tooltip>)}
        </div>}
      </React.Fragment>
    </Tooltip>)}
    <Toggle toggled={state.gridSteps === 2} onToggle={toggleGridSteps} />
  </div>;
}