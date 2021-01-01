import React from 'react';
import { css } from 'astroturf';
import { sanitize } from 'dompurify';
import marked from 'marked';

const classes = css`
  .formattedText {
    margin: 0;
    padding: 0 8px;
    color: white;
  }
  .formattedText h1 {
    font-size: 24px;
    font-family: Helvetica serif;
    padding: 0 8px;
    margin: 0;
    color: white;
  }
  .formattedText p {
    font-size: 18px;
    font-family: Helvetica serif;
    padding: 0;
    margin: 0;
  }
`;

export default function Description(props: { name: string, text: string }) {
  return <div className={classes.formattedText}>
    <h1>{props.name}</h1>
    <div dangerouslySetInnerHTML={{ __html: sanitize(marked(props.text || '')) }} />
  </div>;
}