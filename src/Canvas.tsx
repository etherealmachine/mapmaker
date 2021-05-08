import React, { useContext, useEffect, useRef, useState } from 'react';
import seedrandom from 'seedrandom';

import {
  bbox,
  center,
  colorToIndex,
  detectDoorPlacement,
  dist,
  indexToColor,
  isCCW,
  lerp,
  lerp2,
} from './lib';
import { Context, DecorationType, DoorType, Geometry, Level, State } from './State';
import Zoom from './Zoom';

const backgroundColor = '#D9D2BF';
const floorColor = '#F1ECE0';
const wallColor = '#000';
const selectionFillColor = '#2f557466';
const selectionStrokeColor = '#2f5574';
const dragFillColor = '#2f557466';
const dragStrokeColor = '#2f5574';
const hoverFillColor = '#668dad66';
const hoverStrokeColor = '#668dad';
const pointColor = '#fff238';
const specialColors = [
  selectionFillColor, selectionStrokeColor,
  dragFillColor, dragStrokeColor,
  hoverFillColor, hoverStrokeColor,
];

type Style = string | CanvasPattern | CanvasGradient;

export class CanvasRenderer {
  mouse?: number[] = undefined
  mouseDown: boolean = false
  drag?: {
    start: number[]
    end: number[]
  }
  specialKeys = {
    shift: false,
    alt: false,
    ctrl: false,
    space: false,
  }
  points: number[][] = []
  polygonToolSelected: boolean = false
  hover?: {
    featureIndex: number | undefined
    geometryIndex: number | undefined
  }
  size: number = 30
  fps: number = 0
  requestID?: number
  appState = new State()
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  bufferCanvas: HTMLCanvasElement
  bufferCtx: CanvasRenderingContext2D
  textures: { [key: string]: CanvasPattern } = {}
  dirty: Date = new Date()
  mode: 'edit' | 'print'
  level?: number

  constructor(canvas: HTMLCanvasElement, mode: 'edit' | 'print', level?: number) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx === null) {
      throw new Error('canvas has null rendering context');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.requestID = requestAnimationFrame(this.render);

    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = this.canvas.width;
    this.bufferCanvas.height = this.canvas.height;
    const bufferCtx = this.bufferCanvas.getContext('2d', { alpha: true });
    if (bufferCtx === null) {
      throw new Error('canvas has null rendering context');
    }
    this.bufferCtx = bufferCtx;
    this.mode = mode;
    this.level = level;

    this.loadTextures(['Rectangular Tiles A.jpg', 'Grass Dark Rocky.jpg']);
  }

  attachListeners() {
    if (this.mode === 'print') return;
    this.canvas.addEventListener('touchstart', this.onMouseDown);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('touchend', this.onMouseUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('touchmove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('wheel', this.onWheel, { passive: false });
  }

  detachListeners() {
    if (this.mode === 'print') return;
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('wheel', this.onWheel);
  }

  loadTextures(filenames: string[]) {
    const buf = document.createElement('canvas');
    buf.width = 600;
    buf.height = 600;
    const bufCtx = buf.getContext('2d', { alpha: true });
    if (bufCtx === null) {
      throw new Error('unable to create pattern');
    }
    filenames.forEach(filename => {
      const img = document.createElement('img');
      img.width = 600;
      img.height = 600;
      img.onload = () => {
        bufCtx.drawImage(img, 0, 0);
        const pattern = this.ctx.createPattern(buf, 'repeat');
        if (pattern === null) {
          throw new Error('unable to create pattern');
        }
        const matrix = new DOMMatrix();
        pattern.setTransform(matrix.scale(0.005));
        this.textures[filename] = pattern;
      };
      img.src = `${process.env.PUBLIC_URL}/textures/${filename}`;
    });
  }

  onMouseDown = (e: MouseEvent | TouchEvent) => {
    this.dirty = new Date();
    this.mouseDown = true;
    const { mouse } = this;
    if (e instanceof MouseEvent && e.button === 2) return;
    if (mouse) {
      this.drag = {
        start: this.canvasToTile(mouse),
        end: this.canvasToTile(mouse),
      };
    }
    if (this.appState.tools.pointer.selected) {
      const selectedFeatureIndex = this.appState.selection.featureIndex;
      const hoverFeatureIndex = this.hover?.featureIndex;
      const hoverGeometryIndex = this.hover?.geometryIndex;
      if (e.shiftKey && selectedFeatureIndex !== undefined && hoverFeatureIndex !== undefined && hoverGeometryIndex !== undefined) {
        this.appState.handleGroup(hoverFeatureIndex, hoverGeometryIndex);
      } else {
        this.appState.setSelection({
          ...this.appState.selection,
          featureIndex: this.hover?.featureIndex,
          geometryIndex: this.hover?.geometryIndex,
        });
      }
    } else if (this.appState.tools.doors.selected && mouse) {
      const door = detectDoorPlacement(
        this.worldToTile(this.canvasToWorld(mouse), false),
        this.appState.maps[this.appState.selection.mapIndex].levels[this.appState.selection.levelIndex].features,
        e.shiftKey);
      if (door) this.appState.addDoor(door);
    }
  }

  onMouseUp = () => {
    this.dirty = new Date();
    this.mouseDown = false;
    if (this.mouse && this.appState.tools.polygon.selected) {
      const pos = this.canvasToTile(this.mouse);
      if (this.points.length >= 1 && dist(this.points[0], pos) < 1) {
        this.appState.handlePolygon(this.points);
        this.points = [];
      } else {
        this.points.push(pos);
      }
    } else if (this.appState.tools.brush.selected) {
      this.appState.handleBrush(this.points);
      this.points = [];
      this.drag = undefined;
    } else if (this.drag) {
      let [from, to] = [this.drag.start, this.drag.end];
      if (
        this.appState.tools.rect.selected ||
        this.appState.tools.ellipse.selected) {
        const bounds = bbox([from, to]);
        from = bounds.sw;
        to = bounds.ne;
      }
      this.appState.handleDrag(from, to);
      this.drag = undefined;
      this.points = [];
    }
  }

  onMouseMove = (event: MouseEvent | TouchEvent) => {
    this.dirty = new Date();
    if ('touches' in event && event.target) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      this.mouse = [event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top];
    } else if ('offsetX' in event) {
      this.mouse = [event.offsetX, event.offsetY];
    }
    if (this.mouse && this.mouseDown && this.drag) {
      if (this.specialKeys.space) {
        const end = this.canvasToWorld(this.mouse);
        const delta = [(this.drag.start[0] * this.size) - end[0], (this.drag.start[1] * this.size) - end[1]];
        let newOffset = this.appState.offset;
        newOffset[0] -= delta[0];
        newOffset[1] -= delta[1];
        this.drag.start = this.canvasToTile(this.mouse);
        this.drag.end = this.canvasToTile(this.mouse);
        window.requestAnimationFrame(() => {
          this.appState.setOffset(newOffset);
        });
      } else {
        this.drag.end = this.canvasToTile(this.mouse);
        if (this.appState.tools.brush.selected) {
          this.points.push(this.worldToTile(this.canvasToWorld(this.mouse), false));
        }
      }
    }
  }

  onWheel = (event: WheelEvent) => {
    if (event.x === undefined || event.y === undefined || document.elementFromPoint(event.x, event.y) !== this.canvas) return;
    event.stopPropagation();
    event.preventDefault();
    this.dirty = new Date();
    const { mouse } = this;
    const { scale, offset } = this.appState;
    if (!mouse) return;
    offset[0] -= event.deltaX * scale;
    offset[1] -= event.deltaY * scale;
    window.requestAnimationFrame(() => {
      this.appState.setOffset(offset);
    });
  }

  onKeyDown = (event: KeyboardEvent) => {
    this.dirty = new Date();
    if (event.key === 'Shift') this.specialKeys.shift = true;
    if (event.key === 'Control') this.specialKeys.ctrl = true;
    if (event.key === 'Alt') this.specialKeys.alt = true;
    if (document.activeElement !== document.body) return;
    const { appState } = this;
    if (event.key === 'Backspace' || event.key === 'Delete') {
      appState.handleDelete();
    }
    if (event.key === 'z' && this.specialKeys.ctrl) appState.undo();
    if (event.key === 'y' && this.specialKeys.ctrl) appState.redo();
    if (event.key === ' ') {
      this.canvas.style.cursor = "pointer";
      this.specialKeys.space = true;
      event.preventDefault();
    }
  }

  onKeyUp = (event: KeyboardEvent) => {
    this.dirty = new Date();
    if (event.key === 'Shift') this.specialKeys.shift = false;
    if (event.key === 'Control') this.specialKeys.ctrl = false;
    if (event.key === 'Alt') this.specialKeys.alt = false;
    if (event.key === ' ') {
      this.canvas.style.cursor = "auto";
      this.specialKeys.space = false;
    }
  }

  // canvas coordinates to world coordinates
  canvasToWorld = (p: number[]): number[] => {
    const { offset, scale } = this.appState;
    return [p[0] / scale - offset[0], p[1] / scale - offset[1]];
  }

  // world coordinates to canvas coordinates
  worldToCanvas = (p: number[]): number[] => {
    const { offset, scale } = this.appState;
    return [(p[0] + offset[0]) * scale, (p[1] + offset[1]) * scale];
  }

  // world coordinates to tile coordinates
  worldToTile = (p: number[], round = true): number[] => {
    if (round) {
      const S = this.size / this.appState.gridSteps;
      return [Math.round(p[0] / S) / this.appState.gridSteps, Math.round(p[1] / S) / this.appState.gridSteps];
    }
    return [p[0] / this.size, p[1] / this.size];
  }

  canvasToTile = (p: number[]) => {
    return this.worldToTile(this.canvasToWorld(p));
  }

  zoomToCenter(from: number[], to: number[], scale: number) {
    this.ctx.scale(scale, scale);
    this.ctx.translate(
      (from[0] - (to[0] * scale)) / scale,
      (from[1] - (to[1] * scale)) / scale);
  }

  renderTextCenter(text: string, font: string) {
    this.ctx.font = font;
    const m = this.ctx.measureText(text);
    let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    this.ctx.fillText(text, -m.width / 2, h);
  }

  renderFPS(time: number) {
    const fps = this.fps.toFixed(0);
    this.ctx.save();
    this.ctx.translate(this.canvas.width - 48, 12);
    this.ctx.fillStyle = '#000';
    this.renderTextCenter(fps, "18px Roboto Mono, monospace");
    this.ctx.restore();
  }

  clearScreen() {
    const { canvas, ctx, bufferCanvas } = this;
    if (this.mode === 'edit') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (bufferCanvas.width !== canvas.width || bufferCanvas.height !== canvas.height) {
      bufferCanvas.width = canvas.width;
      bufferCanvas.height = canvas.height;
    }
  }

  drawGrid() {
    const { canvas, ctx } = this;
    const iT = ctx.getTransform().inverse();
    const min = iT.transformPoint({ x: 0, y: 0 });
    const max = iT.transformPoint({ x: canvas.width, y: canvas.height });
    ctx.lineWidth = 0.01;
    ctx.strokeStyle = '#000';
    for (let x = Math.floor(min.x); x <= max.x; x++) {
      ctx.beginPath();
      ctx.moveTo(x, min.y);
      ctx.lineTo(x, max.y);
      ctx.stroke();
    }
    for (let y = Math.floor(min.y); y <= max.y; y++) {
      ctx.beginPath();
      ctx.moveTo(min.x, y);
      ctx.lineTo(max.x, y);
      ctx.stroke();
    }
    if (this.appState.gridSteps !== 1 && this.mode === 'edit') {
      ctx.lineWidth = 0.005;
      ctx.strokeStyle = '#666666';
      for (let x = Math.floor(min.x); x <= max.x; x += 1 / this.appState.gridSteps) {
        ctx.beginPath();
        ctx.moveTo(x, min.y);
        ctx.lineTo(x, max.y);
        ctx.stroke();
      }
      for (let y = Math.floor(min.y); y <= max.y; y += 1 / this.appState.gridSteps) {
        ctx.beginPath();
        ctx.moveTo(min.x, y);
        ctx.lineTo(max.x, y);
        ctx.stroke();
      }
    }
  }

  drawMousePos(mouse: number[]) {
    const { ctx } = this;
    ctx.save();
    const p = this.worldToTile(this.canvasToWorld(mouse), true);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 0.1, 0, 2 * Math.PI);
    ctx.fill();

    if (this.appState.debug) {
      const font = "0.5px Roboto, sans-serif";
      ctx.translate(p[0], p[1] - 1);
      this.renderTextCenter(`Mouse: ${mouse[0].toFixed(0)},${mouse[1].toFixed(0)}`, font);
      ctx.translate(0, -0.5);
      this.renderTextCenter(`Tile: ${p[0].toFixed(0)},${p[1].toFixed(0)}`, font);
    }
    ctx.restore();
  }

  drawDrag() {
    const { drag, appState } = this;
    if (!drag) return;
    const { start, end } = drag;
    if (dist(start, end) > 1 && appState.tools.rect.selected) {
      this.drawGeometry(
        { type: 'polygon', coordinates: [start, [start[0], end[1]], end, [end[0], start[1]]] },
        dragFillColor, dragStrokeColor);
    } else if (dist(start, end) > 1 && appState.tools.stairs.selected) {
      this.drawStairs([start, end], dragFillColor, dragStrokeColor);
    } else if (dist(start, end) > 1 && appState.tools.decoration.selected) {
      this.drawDecoration(appState.tools.decoration.subtype, [start, end], dragFillColor, dragStrokeColor);
    } else if (dist(start, end) > 1 && appState.tools.ellipse.selected) {
      const box = bbox([start, end]);
      this.drawEllipse([box.sw, box.ne], dragFillColor, dragStrokeColor);
    } else {
      this.drawLine([start, end], 0.1, dragStrokeColor);
    }
  }

  drawGeometry(geometry: Geometry, fill?: Style, stroke?: Style, indexColor?: string) {
    if (geometry.type === 'polygon') {
      this.drawPolygon(geometry.coordinates, fill || indexColor, stroke || indexColor);
    } else if (geometry.type === 'ellipse') {
      this.drawEllipse(geometry.coordinates, fill || indexColor, stroke || indexColor);
    } else if (geometry.type === 'line') {
      this.drawLine(geometry.coordinates, indexColor !== undefined ? 0.5 : 0.1, stroke || indexColor);
    } else if (geometry.type === 'brush') {
      this.drawBrush(geometry.coordinates, fill || indexColor, stroke || indexColor);
    } else if (geometry.type === 'door') {
      this.drawDoor(geometry.subtype, geometry.coordinates, stroke || indexColor);
    } else if (geometry.type === 'stairs') {
      this.drawStairs(geometry.coordinates, indexColor, stroke || indexColor);
    } else if (geometry.type === 'decoration') {
      this.drawDecoration(geometry.subtype, geometry.coordinates, indexColor, stroke || indexColor);
    }
  }

  drawPolygon(points: number[][], fill?: Style, stroke?: Style) {
    const { ctx } = this;
    this.pathPoints(points, true);
    if (fill) {
      ctx.fillStyle = this.textures['Rectangular Tiles A.jpg'];
      // ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.1;
      if (stroke instanceof CanvasGradient || stroke instanceof CanvasPattern) ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (fill && typeof fill === 'string' && specialColors.includes(fill)) {
      this.drawPoints(points);
      const box = bbox(points);
      ctx.fillStyle = '#000';
      ctx.save();
      ctx.translate(box.sw[0] + box.w / 2, box.ne[1] - 1);
      this.renderTextCenter(`${box.w * 5}ft x ${box.h * 5}ft`, "1px Roboto, sans-serif");
      ctx.restore();
    }
  }

  drawEllipse(points: number[][], fill?: Style, stroke?: Style) {
    const { ctx } = this;
    this.pathEllipse(points, true);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }
    if (fill && typeof fill === 'string' && specialColors.includes(fill)) {
      const box = bbox(points);
      this.drawPoints([box.sw, [box.sw[0], box.ne[1]], box.ne, [box.ne[0], box.sw[1]]]);
      ctx.fillStyle = '#000';
      ctx.save();
      ctx.translate(box.sw[0] + box.w / 2, box.ne[1] - 1);
      this.renderTextCenter(`${box.w * 5}ft x ${box.h * 5}ft`, "1px Roboto, sans-serif");
      ctx.restore();
    }
  }

  drawLine(points: number[][], width: number, stroke?: Style) {
    const { ctx } = this;
    this.pathPoints(points);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  drawBrush(points: number[][], fill?: Style, stroke?: Style) {
    const { ctx } = this;
    this.pathPoints(points);
    if (fill) {
      ctx.strokeStyle = this.textures['Grass Dark Rocky.jpg'];
      // ctx.strokeStyle = fill;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    this.ctx.globalCompositeOperation = 'destination-over';
    if (stroke) {
      // ctx.strokeStyle = this.textures['Grass Dark Rocky.jpg'];
      ctx.strokeStyle = stroke;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    this.ctx.globalCompositeOperation = 'source-over';
    if (fill && typeof fill === 'string' && specialColors.includes(fill)) {
      this.drawPoints(points, 0.1);
    }
  }

  drawDoor(type: DoorType, points: number[][], stroke?: Style) {
    switch (type) {
      case 'normal':
        this.drawNormalDoor(points, stroke);
        break;
      case 'secret':
        this.drawSecretDoor(points, stroke);
        break;
      default:
        throw new Error(`unsupported door type ${type}`);
    }
  }

  drawNormalDoor(points: number[][], stroke?: Style) {
    const { ctx } = this;
    const [from, to] = points;
    const a = lerp2(0.1, from, to);
    const b = lerp2(0.9, from, to);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineCap = 'butt';
      ctx.lineWidth = 0.1;
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
  }

  drawSecretDoor(points: number[][], stroke?: Style) {
    const { ctx } = this;
    const [from, to] = points;
    if (stroke) {
      const l = Math.max(Math.abs(from[0] - to[0]), Math.abs(from[1] - to[1]));
      const [x, y] = [to[0] - from[0], to[1] - from[1]];
      ctx.font = `${l}px Helvetica`;
      const theta = Math.atan(x / y);
      const [ox, oy] = [from[0] + x / 2, from[1] + y / 2];
      ctx.save();
      ctx.fillStyle = stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(ox, oy);
      ctx.rotate(theta);
      ctx.fillText('S', 0, 0);
      ctx.restore();
    }
  }

  drawStairs(points: number[][], fill?: Style, stroke?: Style) {
    if (!stroke) return;
    const { ctx } = this;
    const [from, to] = points;
    const w = Math.abs(to[0] - from[0]);
    const h = Math.abs(to[1] - from[1]);
    const sx = Math.sign(to[0] - from[0]);
    const sy = Math.sign(to[1] - from[1]);
    const L = Math.max(w, h);
    const W = Math.min(w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.1;
    ctx.lineCap = 'butt';
    for (let i = 0; i < L; i += 0.5) {
      const l = lerp(i / (L + .5), 0.1, W);
      ctx.beginPath();
      if (w > h) {
        ctx.moveTo(from[0] + i * sx, Math.min(from[1], to[1]) + (W - l) / 2);
        ctx.lineTo(from[0] + i * sx, Math.min(from[1], to[1]) + (W - l) / 2 + l);
      } else {
        ctx.moveTo(Math.min(from[0], to[0]) + (W - l) / 2, from[1] + i * sy);
        ctx.lineTo(Math.min(from[0], to[0]) + (W - l) / 2 + l, from[1] + i * sy);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    if (w > h) {
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.lineTo(from[0], to[1]);
    } else {
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(from[0], to[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.lineTo(to[0], from[1]);
    }
    ctx.stroke();
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke && typeof stroke === 'string' && specialColors.includes(stroke)) {
      this.drawPoints(points);
    }
  }

  drawDecoration(type: DecorationType, points: number[][], fill?: Style, stroke?: Style) {
    switch (type) {
      case 'statue':
        this.drawStatue(points, fill, stroke);
        break;
      case 'column':
        this.drawColumn(points, fill);
        break;
      case 'stalacmite':
        this.drawStalacmite(points, fill, stroke);
        break;
      default:
        throw new Error(`unsupported decoration type ${type}`);
    }
  }

  drawStatue(points: number[][], fill?: Style, stroke?: Style) {
    if (!stroke) return;
    const { ctx } = this;
    const [from, to] = points;
    const r = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) / 2;
    const [cx, cy] = [from[0] + r, from[1] + r];
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
    ctx.stroke();
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    const r2 = r * 0.4;
    ctx.beginPath();
    let theta = -0.1 * Math.PI;
    for (let i = 0; i < 10; i++) {
      if (i === 0) {
        ctx.moveTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
      } else {
        ctx.lineTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
      }
      theta += 0.2 * Math.PI;
      ctx.lineTo(cx + r2 * Math.cos(theta), cy + r2 * Math.sin(theta));
      theta += 0.2 * Math.PI;
    }
    ctx.closePath();
    ctx.fillStyle = stroke;
    ctx.fill();
    if (stroke && typeof stroke === 'string' && specialColors.includes(stroke)) {
      this.drawPoints(points);
    }
  }

  drawColumn(points: number[][], stroke?: Style) {
    if (!stroke) return;
    const { ctx } = this;
    const [from, to] = points;
    const r = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) / 2;
    const [cx, cy] = [from[0] + r, from[1] + r];
    ctx.fillStyle = stroke;
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
    ctx.fill();
    if (stroke && typeof stroke === 'string' && specialColors.includes(stroke)) {
      this.drawPoints(points);
    }
  }

  drawStalacmite(points: number[][], fill?: Style, stroke?: Style) {
    if (!stroke) return;
    const { ctx } = this;
    const [from, to] = points;
    const rng = seedrandom(`(${from[0]},${from[1]}),(${to[0]},${to[1]})`);
    const r = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) / 2;
    const [cx, cy] = [from[0] + r, from[1] + r];
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    let currRadius = r * Math.max(0.5, rng());
    let theta = -0.1 * Math.PI;
    for (let i = 0; i < 20; i++) {
      if (i === 0) {
        ctx.moveTo(cx + currRadius * Math.cos(theta), cy + currRadius * Math.sin(theta));
      } else {
        ctx.lineTo(cx + currRadius * Math.cos(theta), cy + currRadius * Math.sin(theta));
      }
      theta += rng() * 0.2 * Math.PI;
      if (theta + 0.1 * Math.PI >= 2 * Math.PI) break;
      if (rng() < 0.5) currRadius += rng() * 0.3;
      else currRadius -= rng() * 0.3;
      currRadius = Math.max(0, Math.min(r, currRadius));
    }
    ctx.closePath();
    ctx.stroke();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke && typeof stroke === 'string' && specialColors.includes(stroke)) {
      this.drawPoints(points);
    }
  }

  drawPoints(points: number[][], size: number = 0.25) {
    const { ctx } = this;
    ctx.fillStyle = pointColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.05;
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.ellipse(points[i][0], points[i][1], size, size, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  pathPoints(points: number[][], close: boolean = false) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    if (close) ctx.closePath();
  }

  pathEllipse(points: number[][], close: boolean = false) {
    const { ctx } = this;
    const [a, b] = points;
    ctx.beginPath();
    ctx.ellipse(
      a[0] + (b[0] - a[0]) / 2,
      a[1] + (b[1] - a[1]) / 2,
      Math.abs((b[0] - a[0]) / 2),
      Math.abs((a[1] - b[1]) / 2),
      0,
      0,
      2 * Math.PI);
    if (close) ctx.closePath();
  }

  drawFeatures(level: Level, colorIndex: boolean = false) {
    const featureDrawOrder = ['room', 'other', 'text'];
    const geometryDrawOrder = ['polygon', 'ellipse', 'line', 'brush', 'door', 'stairs', 'decoration'];
    featureDrawOrder.forEach(featureType => {
      geometryDrawOrder.forEach(geometryType => {
        level.features.forEach((feature, i) => {
          if (feature.properties.type !== featureType) return;
          feature.geometries.forEach((geometry, j) => {
            if (geometry.type !== geometryType) return;
            if (!geometry.coordinates || geometry.coordinates.length === 0) return;
            if (colorIndex) {
              this.drawGeometry(geometry, undefined, undefined, indexToColor(i, j));
            } else {
              let areaColor: Style = floorColor;
              if (geometry.type === 'polygon' && !isCCW(geometry.coordinates)) {
                areaColor = backgroundColor;
              }
              this.drawGeometry(geometry, areaColor, wallColor);
            }
          });
        });
      });
    });
    if (!colorIndex) {
      level.features.filter(feature => feature.properties.name).forEach((feature, i) => {
        const c = center(feature);
        if (!c) return;
        this.ctx.save();
        this.ctx.translate(c[0], c[1] - 0.25);
        this.ctx.fillStyle = '#000';
        this.renderTextCenter(`${i + 1}`, '0.5px Helvetica');
        this.ctx.restore();
      });
    }
  }

  drawLevel(level: Level, selectable: boolean) {
    const { appState } = this;
    const { width, height } = this.canvas;

    const tmp = this.ctx;

    this.ctx = this.bufferCtx;

    if (selectable) {
      // color-indexed mouse picking
      this.ctx.resetTransform();
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = "#fff";
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.save();
      this.ctx.scale(appState.scale, appState.scale);
      this.ctx.translate(appState.offset[0], appState.offset[1]);
      this.ctx.scale(this.size, this.size);
      this.drawFeatures(level, true);
      if (this.mouse) {
        const p = this.ctx.getImageData(this.mouse[0], this.mouse[1], 1, 1).data;
        const [featureIndex, geometryIndex] = colorToIndex(p[0], p[1], p[2]);
        if (featureIndex === Infinity || featureIndex >= level.features.length || geometryIndex >= level.features[featureIndex].geometries.length) {
          this.hover = undefined;
        } else {
          this.hover = { featureIndex, geometryIndex };
        }
      }
      this.ctx.restore();
    }

    // setup transform and clear buffer
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();
    if (this.mode === 'edit') {
      this.ctx.scale(appState.scale, appState.scale);
      this.ctx.translate(appState.offset[0], appState.offset[1]);
      this.ctx.scale(this.size, this.size);
    } else {
      const range = level.features.reduce(([sw, ne], feature) => {
        return feature.geometries.reduce(([sw, ne], geometry) => {
          const minX = Math.min(...geometry.coordinates.map(p => p[0]));
          const maxX = Math.max(...geometry.coordinates.map(p => p[0]));
          const minY = Math.min(...geometry.coordinates.map(p => p[1]));
          const maxY = Math.max(...geometry.coordinates.map(p => p[1]));
          return [
            [Math.min(sw[0], minX), Math.max(sw[1], maxY)],
            [Math.max(ne[0], maxX), Math.min(ne[1], minY)],
          ];
        }, [sw, ne]);
      }, [[Infinity, -Infinity], [-Infinity, Infinity]]);
      const w = range[1][0] - range[0][0];
      const h = range[0][1] - range[1][1];
      const extent = Math.max(w, h);
      const scale = Math.max(this.canvas.width - 20, this.canvas.height - 20) / extent;
      const levelMid = [range[0][0] + w / 2, range[1][1] + h / 2];
      this.zoomToCenter([this.canvas.width / 2, this.canvas.height / 2], [levelMid[0], levelMid[1]], scale);
    }

    this.drawFeatures(level);

    if (selectable && appState.tools.pointer.selected) {
      if (this.hover !== undefined && this.hover.featureIndex !== undefined) {
        const hover = level.features[this.hover.featureIndex];
        if (this.hover.geometryIndex !== undefined && hover !== undefined) {
          this.drawGeometry(hover.geometries[this.hover.geometryIndex], hoverFillColor, hoverStrokeColor);
        }
      }
      const selection = this.appState.getSelectedFeature();
      if (selection) {
        selection.feature.geometries.forEach(geometry => {
          this.drawGeometry(
            geometry,
            geometry === selection.geometry ? selectionFillColor : hoverFillColor,
            geometry === selection.geometry ? selectionStrokeColor : hoverFillColor);
        });
        if (this.drag && dist(this.drag.start, this.drag.end)) {
          this.ctx.save();
          const deltaDrag = [this.drag.end[0] - this.drag.start[0], this.drag.end[1] - this.drag.start[1]];
          this.ctx.translate(deltaDrag[0], deltaDrag[1]);
          selection.feature.geometries.forEach(geometry => {
            this.drawGeometry(geometry, dragFillColor, dragStrokeColor);
          });
          this.ctx.restore();
        }
      }
    }

    this.ctx.globalCompositeOperation = 'source-over';
    if (appState.tools.doors.selected && this.mouse) {
      const door = detectDoorPlacement(
        this.worldToTile(this.canvasToWorld(this.mouse), false),
        level.features,
        this.specialKeys.shift);
      if (door) {
        this.drawDoor(appState.tools.doors.subtype, [door.from, door.to], wallColor);
      }
    }

    if (this.mode === 'edit') {
      this.ctx.globalCompositeOperation = 'source-over';
    } else {
      this.ctx.globalCompositeOperation = 'source-atop';
    }
    this.drawGrid();

    /*
    const pattern = this.pattern;
    if (pattern) {
      pattern.setTransform(this.ctx.getTransform().inverse());
      this.ctx.globalCompositeOperation = 'source-atop';
      const range = level.features.reduce(([sw, ne], feature) => {
        return feature.geometries.reduce(([sw, ne], geometry) => {
          const minX = Math.min(...geometry.coordinates.map(p => p[0]));
          const maxX = Math.max(...geometry.coordinates.map(p => p[0]));
          const minY = Math.min(...geometry.coordinates.map(p => p[1]));
          const maxY = Math.max(...geometry.coordinates.map(p => p[1]));
          return [
            [Math.min(sw[0], minX), Math.max(sw[1], maxY)],
            [Math.max(ne[0], maxX), Math.min(ne[1], minY)],
          ];
        }, [sw, ne]);
      }, [[Infinity, -Infinity], [-Infinity, Infinity]]);
      const w = range[1][0] - range[0][0];
      const h = range[0][1] - range[1][1];
      this.ctx.fillStyle = pattern;
      this.ctx.rect(range[0][0] - 1, range[1][1] - 1, w + 2, h + 2);
      this.ctx.fill();
      this.ctx.globalCompositeOperation = 'source-over';
    }
    */

    this.ctx.restore();

    tmp.drawImage(this.bufferCanvas, 0, 0);

    this.ctx = tmp;
  }

  render = (time: number) => {
    if (new Date().getTime() - this.dirty.getTime() < 5000) {
      const startTime = performance.now();
      const { ctx, appState } = this;
      const { tools } = appState;
      if (this.polygonToolSelected && !appState.tools.polygon.selected) {
        this.points = [];
      }
      this.polygonToolSelected = appState.tools.polygon.selected;

      ctx.resetTransform();
      this.bufferCtx.resetTransform();

      this.clearScreen();

      // http://jeroenhoek.nl/articles/svg-and-isometric-projection.html
      // ctx.transform(0.866, 0.5, -0.866, 0.5, 0, 0);

      const map = this.appState.maps[this.appState.selection.mapIndex];
      const currLevel = this.level !== undefined ? map.levels[this.level] : map.levels[this.appState.selection.levelIndex];
      this.drawLevel(currLevel, this.mode === 'edit');
      if (this.mode === 'edit') {
        ctx.globalAlpha = 0.2;
        Object.entries(this.appState.selection.ghostLevels).forEach(([levelIndex, ghost]) => {
          if (ghost) this.drawLevel(map.levels[parseInt(levelIndex)], false);
        });
        ctx.globalAlpha = 1;
      }

      if (this.mode === 'edit') {
        ctx.save();

        ctx.scale(appState.scale, appState.scale);
        ctx.translate(appState.offset[0], appState.offset[1]);
        ctx.scale(this.size, this.size);

        if (this.mouse) {
          this.drawMousePos(this.mouse);
        }

        if (this.points.length > 0 && tools.polygon.selected) {
          this.drawPolygon(this.points, dragFillColor, dragStrokeColor);
        } else if (this.points.length > 0 && tools.brush.selected) {
          this.drawBrush(this.points, dragFillColor, dragStrokeColor);
        } else if (this.drag) {
          this.drawDrag();
        }
      }

      ctx.restore();

      const fps = performance.now() - startTime;
      this.fps = (fps * 0.1) + this.fps * 0.9;
      if (appState.debug) {
        this.renderFPS(time);
      }
    }
    this.requestID = requestAnimationFrame(this.render);
  }
}

export default function Canvas(props: { mode: 'edit' | 'print', level?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appState = useContext(Context);
  const [renderer, setRenderer] = useState<CanvasRenderer | undefined>();
  useEffect(() => {
    if (canvasRef.current === null) return;
    const canvas = canvasRef.current;
    const renderer: CanvasRenderer = new CanvasRenderer(canvas, props.mode, props.level);
    const syncSize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || canvas.width;
      canvas.height = canvas.parentElement?.offsetHeight || canvas.height;
      renderer.dirty = new Date();
    };
    syncSize();
    renderer.attachListeners();
    window.addEventListener('resize', syncSize);
    renderer.appState = appState;
    renderer.mode = props.mode;
    appState.notifyChange = () => {
      renderer.dirty = new Date();
    };
    setRenderer(renderer);
    return () => {
      window.removeEventListener('resize', syncSize);
      renderer.detachListeners();
    }
  }, [canvasRef, appState, props.mode, props.level]);
  return <div style={{ height: "100%", width: "100%" }}>
    <canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
    {props.mode === 'edit' && <Zoom renderer={renderer} />}
  </div>;
}
