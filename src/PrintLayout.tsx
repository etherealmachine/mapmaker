import React, { useContext } from 'react';
import { css } from 'astroturf';
import marked from 'marked';
import { sanitize } from 'dompurify';

import Canvas from './Canvas';
import { Context, Level } from './State';

const classes = css`
  .print {
    display: flex;
    flex-direction: column;
    font-family: Helvetica serif;
  }
  .page {
    width: 8in;
    height: 10.5in;
    display: flex;
    flex-direction: column;
    margin-left: auto;
    margin-right: auto;
    border-bottom: 1px solid black;
    padding: 0.25in;
  }
  @media print {
    .page {
      border-bottom: none !important;
    }
  }
  .pages {
    width: 8in;
    display: flex;
    flex-direction: column;
    margin-left: auto;
    margin-right: auto;
    padding: 0.25in;
  }
`;

export default function PrintLayout() {
  const appState = useContext(Context);
  const map = appState.maps[appState.selection.mapIndex];
  let levels: Level[] = [];
  map.levels.forEach((level, i) => {
    levels.push({
      ...level,
      features: level.features.filter(feature => feature.properties.name),
    })
  });
  return <div className={classes.print}>
    <div className={classes.page}>
      <h2>{map.name}</h2>
      <div dangerouslySetInnerHTML={{ __html: sanitize(marked(map.description || '')) }} />
      <div style={{ flexGrow: 1 }}>
        <Canvas mode="print" level={0} />
      </div>
    </div>
    <div className={classes.pages}>
      {levels.map((level, i) => <div key={i}>
        <div style={{ height: '5in' }}>
          <Canvas mode="print" level={i} />
        </div>
        <h2>{level.name}</h2>
        <div dangerouslySetInnerHTML={{ __html: sanitize(marked(level.description || '')) }} />
        {level.features.map((feature, j) => <div key={j}>
          <h3>{`${i + 1}.${j + 1} ${feature.properties.name}`}</h3>
          <div dangerouslySetInnerHTML={{ __html: sanitize(marked(feature.properties.description || '')) }} />
        </div>)}
      </div>)}
    </div>
  </div>;
}