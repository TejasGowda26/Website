// room.js — puts the room together from its three parts and hands the result
// to main.js:
//   outside.js    the 3D city seen through the window
//   furniture.js  walls, window, curtains, desk, chair, lamps, plants, lights
//   props.js      the clickable project objects
//   details.js    small non-clickable touches (fairy lights, candle, pen cup …)

import * as THREE from 'three';
import { LAYOUT } from './kit.js';
import { buildOutside } from './outside.js';
import { buildFurniture } from './furniture.js';
import { buildProps } from './props.js';
import { buildDetails } from './details.js';

export function buildRoom(scene, { demoCanvas, photoUrl }) {
  const outside = buildOutside(scene);
  const furniture = buildFurniture(scene);
  const room = buildProps(scene, { demoCanvas, photoUrl });
  const details = buildDetails(scene);
  room.LAYOUT = LAYOUT;
  room.refreshers.push(...furniture.refreshers);

  // A light violet haze so far-away buildings fade into the evening sky. It is far
  // too thin to be noticeable inside the room.
  const { haze } = outside.setEvening();
  scene.fog = new THREE.FogExp2(haze, 0.011);
  scene.background = scene.fog.color;

  // Small background animations: curtains, leaves, dust, the clock, the train.
  room.tick = (t, dt) => { outside.tick(t, dt); for (const f of furniture.ticks) f(t, dt); for (const f of details.ticks) f(t, dt); };
  return room;
}
