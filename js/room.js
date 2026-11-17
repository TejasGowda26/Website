// room.js — puts the room together from its three parts and hands the result
// to main.js:
//   outside.js    the 3D city seen through the window
//   furniture.js  walls, window, curtains, desk, chair, lamps, plants, lights
//   props.js      the clickable project objects

import * as THREE from 'three';
import { LAYOUT } from './kit.js';
import { buildOutside } from './outside.js';
import { buildFurniture } from './furniture.js';
import { buildProps } from './props.js';

export function buildRoom(scene, { demoCanvas, hour, photoUrl }) {
  const outside = buildOutside(scene);
  const furniture = buildFurniture(scene);
  const room = buildProps(scene, { demoCanvas, photoUrl });
  room.LAYOUT = LAYOUT;
  room.refreshers.push(...furniture.refreshers);

  // A light haze so far-away buildings fade towards the sky colour. It is far
  // too thin to be noticeable inside the room.
  scene.fog = new THREE.FogExp2('#8090b0', 0.011);

  // Call with an hour from 0 to 24 to set the time of day everywhere at once.
  room.setHour = (h) => {
    const s = outside.setTime(h);
    furniture.setTime(s, h);
    scene.fog.color.setRGB(s.low[0] / 255, s.low[1] / 255, s.low[2] / 255, THREE.SRGBColorSpace);
    scene.background = scene.fog.color;
    room.daylight = s.daylight;
    return s;
  };
  room.setHour(hour);

  // Small background animations: curtains, leaves, dust, the clock, the train.
  room.tick = (t, dt) => { outside.tick(t, dt); for (const f of furniture.ticks) f(t, dt); };
  return room;
}
