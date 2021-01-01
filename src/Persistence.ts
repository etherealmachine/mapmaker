import { Dispatch, SetStateAction, useState } from "react";

function isObject(i: any) {
  return (i && typeof i === 'object' && !Array.isArray(i));
}

function inflate(target: any, ...objs: any[]): any {
  if (!objs.length) return target;
  const obj = objs.shift();
  if (isObject(target) && isObject(obj)) {
    for (const key in obj) {
      if (isObject(obj[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        inflate(target[key], obj[key]);
      } else {
        if (Object.isFrozen(target)) {
          target = unfreeze(target);
        }
        Object.assign(target, { [key]: obj[key] });
      }
    }
  }
  return inflate(target, ...objs);
}

function unfreeze(o: any) {
  let oo: any = undefined;
  if (o instanceof Array) {
    oo = []; const clone = (v: any) => { oo.push(v) };
    o.forEach(clone);
  } else if (o instanceof String) {
    oo = o;
  } else if (typeof o == 'object') {
    oo = {};
    for (var property in o) { oo[property] = o[property]; }
  }
  return oo;
}

export function useLocalStorageState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const fromLocalStorage = window.localStorage.getItem(key);
  if (fromLocalStorage !== null) inflate(initial, JSON.parse(fromLocalStorage));
  const [state, setState] = useState<T>(initial);
  return [state, (newState: any) => {
    window.localStorage.setItem(key, JSON.stringify(newState));
    setState(newState);
  }];
}