# Tejas V Gowda — 3D studio portfolio

A portfolio site drawn as a 3D room. Every object in the room is a project or a
job: click it, the camera flies over, and a panel shows the details.

It is plain HTML, CSS and JavaScript. There is nothing to install or build, so
GitHub Pages can serve this folder exactly as it is.

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | The page itself: buttons, panels, and the canvas the room is drawn on |
| `css/style.css` | Colours, fonts and layout of everything around the room |
| `js/content.js` | **All the words on the site. Edit this to change text.** |
| `js/room.js` | Puts the room together from the three files below |
| `js/furniture.js` | Walls, window, curtains, standing desk, chair, lamps, plants, and all the lighting |
| `js/props.js` | The clickable objects, one block per project or job |
| `js/outside.js` | The 3D city seen through the window (buildings, metro train, trees, clouds) |
| `js/kit.js` | Shared helpers, plus `LAYOUT`: the numbers that say where the big pieces sit |
| `js/main.js` | Camera movement, clicking, the side panel, the list view, reflections and visual effects |
| `js/demo.js` | The small traffic-jam game on the monitor |
| `js/sky.js` | The sky colours, which follow the visitor's clock |
| `vendor/` | Three.js, the library that draws 3D in the browser (do not edit) |
| `resume.pdf` | The file behind every "Download resume" button |

## Changing things

- **Text, numbers, links:** edit `js/content.js`. Each object has a block there.
- **Resume:** replace `resume.pdf` with a new file of the same name.
- **Accent colour:** change `--accent` at the top of `css/style.css`.
- **Your photo in the frame on the shelf:** add an image (for example
  `assets/me.jpg`) and add the line `photo: 'assets/me.jpg',` inside `profile`
  in `js/content.js`.

## Looking at it on your own computer

Double-clicking `index.html` will show a blank page, because browsers block
JavaScript modules opened straight from disk. Start a tiny local web server
instead. In a terminal, inside this folder:

```
python -m http.server 8000
```

Then open http://localhost:8000 in your browser. Press Ctrl+C to stop it.

Handy address tricks while testing:

- `?hour=18.5` shows the window at 6:30 pm (any hour from 0 to 24)
- `?simple` opens the plain list view
- `?quality=low` or `?quality=high` forces the lighter or fuller graphics
- `#tja`, `#mpc`, `#can`, `#patent` and so on jump straight to an object

## Swapping in Blender models later

Each object is built in its own block in `js/props.js` and registered with a
line like `register('patent', g, …)`. To use a model instead, export it from
Blender as a `.glb` file, load it with Three.js's `GLTFLoader`, add it to the
group `g` in place of the boxes, and keep the `register` line as it is. The
clicking, labels and side panel will keep working.

## Good to know

- With no WebGL (very old devices), the site shows the plain list view instead.
- On slow devices it automatically turns off the glow and ambient-occlusion
  effects and draws at a lower resolution, to stay smooth.
- Lighting: the softbox is the main light, the window adds daylight or
  moonlight, and the lamps and shelf strips add warmth. Brightness numbers are
  in `js/furniture.js` (search for `Light(`).
- To move the camera's resting position, change `VIEW` in `js/main.js`.
- The driving demo is a simplified toy inspired by the Traffic Jam Assist
  project. It is not the Simulink model.
- Three.js is MIT licensed; see `vendor/THREE-LICENSE.txt`.
