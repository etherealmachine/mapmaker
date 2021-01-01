declare module 'polybooljs' {
  module PolyBool {
    export interface Polygon {
      regions: number[][][]
      inverted: boolean
    }
    export function union(poly1: Polygon, poly2: Polygon): Polygon;
    export function intersect(poly1: Polygon, poly2: Polygon): Polygon;
    export function difference(poly1: Polygon, poly2: Polygon): Polygon;
    export function xor(poly1: Polygon, poly2: Polygon): Polygon;
  }
  export = PolyBool;
}