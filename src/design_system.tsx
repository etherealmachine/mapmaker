import { css } from 'astroturf';

export const DS = css`
  .button {
    background: transparent;
    border: none;
    outline: none;
    margin: 4px;
    padding: 8px 12px;
    color: white;
    font-size: 18px;
    font-weight: 600;
    box-sizing: border-box;
    border-radius: 2px;
    box-shadow: 0 2px 2px 0 rgba(255,255,255,0.14), 0 3px 1px -2px rgba(255,255,255,0.12), 0 1px 5px 0 rgba(255,255,255,0.2);
  }

  .button:hover {
    background: #505050;
    box-shadow: 0 3px 3px 0 rgba(255,255,255,0.14), 0 1px 7px 0 rgba(255,255,255,0.12), 0 3px 1px -1px rgba(255,255,255,0.2);
  }

  .button:active {
    outline: none;
    box-shadow: -3px -3px 8px rgba(255, 255, 255, 0.9), 3px 3px 8px rgba(255, 255, 255, 0.9);
  }

  .buttonSmall {
    background: transparent;
    border: none;
    outline: none;
    margin: 4px;
    color: white;
    font-size: 18px;
    font-weight: 600;
    box-sizing: border-box;
    border-radius: 2px;
    box-shadow: 0 2px 2px 0 rgba(255,255,255,0.14), 0 3px 1px -2px rgba(255,255,255,0.12), 0 1px 5px 0 rgba(255,255,255,0.2);
  }

  .buttonSmall:hover {
    background: #505050;
    box-shadow: 0 3px 3px 0 rgba(255,255,255,0.14), 0 1px 7px 0 rgba(255,255,255,0.12), 0 3px 1px -1px rgba(255,255,255,0.2);
  }

  .buttonSmall:active {
    outline: none;
    box-shadow: -3px -3px 8px rgba(255, 255, 255, 0.9), 3px 3px 8px rgba(255, 255, 255, 0.9);
  }

  .danger {
    background: #A20B25;
  }

  .danger:hover {
    background: #a03e4e;
  }

  .input {
    font-size: 18px;
    background: transparent;
    color: white;
    border: none;
    border-bottom: 1px solid white;
    padding: 4px;
    margin: 4px;
    margin-bottom: 1px;
  }
  
  .input:focus {
    outline: none;
    border-bottom: 2px solid white;
    margin-bottom: 0px;
  }

  .toolbar {
    display: flex;
    flex-direction: column;
    background: #000;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.2);
    color: white;
  }
  .toolbar svg {
    color: white;
    font-size: 24px;
  }
  .toolbar .selected svg {
    color: black;
  }
  .toolbar button {
    background: black;
    width: 50px;
    height: 50px;
    border: 1px solid white;
    outline: none;
    margin: 4px;
  }
  .toolbar button:hover {
    background: #505050;
    box-shadow: -2px -2px 8px rgba(255, 255, 255, 0.9), 2px 2px 8px rgba(255, 255, 255, 0.9);
  }
  .toolbar button:active {
    outline: none;
    border: none;
    scale: 0.9;
  }
  .toolbar button.selected {
    background: #bbb;
    box-shadow: -1px -1px 8px rgba(255, 255, 255, 0.5), 1px 1px 8px rgba(255, 255, 255, 0.5);
  }
  .toolbar button[disabled] {
    background: #444;
    box-shadow: none;
  }
`;