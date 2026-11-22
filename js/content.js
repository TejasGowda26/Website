// ============================================================================
//  content.js — ALL the words on the site live in this one file.
//
//  To change text, edit the strings below and save. You do not need to touch
//  any other file. Each entry in `items` is one clickable object in the room:
//
//    id       which 3D object it belongs to (do not rename these)
//    label    the short name shown next to the object's dot
//    kicker   the small line above the title
//    title    the big heading in the side panel
//    summary  one or two sentences under the title
//    stats    up to three headline numbers: { value, label }
//    points   bullet points
//    tools    small tags at the bottom
// ============================================================================

export const profile = {
  name: 'Tejas V Gowda',
  tagline: 'EV motor control, ADAS and vehicle systems',
  location: 'Bengaluru, Karnataka',
  email: 'tejas26gowda@gmail.com',
  phone: '+91 83105 44316',
  github: 'https://github.com/tejasgowda26',
  resumePdf: 'resume.pdf',
  // The contact form posts here (same Formspree form the old site used).
  formEndpoint: 'https://formspree.io/f/meedoddb',
  summary:
    'Final-year Electrical and Electronics Engineering student aiming for EV motor-control, ADAS and vehicle-systems roles. ' +
    'I built a driver-in-the-loop Level-2 Traffic Jam Assist on a 14-DOF vehicle model with a force-feedback steering wheel ' +
    '(IEEE conference paper in preparation) and a neural-network MPC that cut DC-motor speed-tracking error by 66% versus PID. ' +
    'Hands-on with EV powertrain hardware, CAN-bus tooling and industrial motor-control panels; currently learning embedded C.',
};

export const items = [
  {
    id: 'tja',
    section: 'projects',
    label: 'Traffic Jam Assist',
    kicker: 'Major project · 2026',
    title: 'Comfort-Aware Traffic Jam Assist',
    summary:
      'A simulated SAE Level-2 Traffic Jam Assist for 0–30 km/h highway traffic, built on a 14-DOF vehicle model and validated with a force-feedback steering wheel in the loop.',
    stats: [
      { value: '1.55 → 0.45 m', label: 'Max lane drift of a simulated inattentive driver (p = 0.0012, 10 held-out scenarios)' },
      { value: '0 collisions', label: 'In 20 evaluation runs of the residual SAC agent' },
      { value: '5 modes', label: 'Risk-scheduled haptic shared control, capped at 3.9 Nm with a passivity guard' },
    ],
    points: [
      'Reactive 3-lane, 12-vehicle traffic engine with IDM car-following, MOBIL lane changes and a motorcycle lane-filtering state machine. Scenarios are seeded and fully repeatable.',
      'Residual Soft Actor-Critic agent trained on top of an IDM cruise and lane-keeping controller, behind a time-to-collision safety shield.',
      'Rear-axle torque-vectoring yaw control on the 14-DOF model.',
      'Found and fixed a body-vs-world coordinate-frame bug, re-ran every result and withdrew an earlier claimed gain. Now extending the work for an IEEE conference paper (in preparation).',
    ],
    tools: ['MATLAB / Simulink', 'Simscape Multibody', 'Vehicle Dynamics Blockset', 'RL Toolbox (SAC)', 'Python (pygame, UDP)', 'MOZA R3 wheel'],
    drive: true,
  },
  {
    id: 'mpc',
    section: 'projects',
    label: 'NN-MPC motor control',
    kicker: 'Mini project',
    title: 'Neural-Network Model Predictive Control of a DC Motor',
    summary:
      'A neural state-space model of a DC motor, used as the prediction model inside a model predictive speed controller.',
    stats: [
      { value: '66%', label: 'Lower speed-tracking RMSE than PID under a 0.04 N·m load disturbance (0.059 vs 0.174 rad/s)' },
      { value: '93.1% / 91.6%', label: 'Model fit on independent test data (R² = 0.995 / 0.993)' },
      { value: '15 / 4 steps', label: 'Prediction and control horizons, with ±24 V input limits' },
    ],
    points: [
      'Identified a neural state-space model of the motor: voltage in, current and speed out.',
      'Used it as the prediction model of an NN-MPC speed controller and compared it against a PID baseline.',
    ],
    tools: ['MATLAB', 'Simulink', 'Neural state-space models', 'Model Predictive Control'],
  },
  {
    id: 'can',
    section: 'projects',
    label: 'CAN-bus security',
    kicker: 'Contributor · M.Tech project',
    title: 'CAN-Bus Sniffing and AES-128 Encryption for Secure ECU Communication',
    summary:
      'Reading a real car’s CAN bus through the OBD-II port, then testing encrypted messaging between two ECUs.',
    stats: [
      { value: '2013 Nissan Micra', label: 'Live CAN traffic logged and decoded through the OBD-II port' },
      { value: '8-byte frames', label: 'AES-128 (Fernet) messages split to fit standard CAN frames' },
    ],
    points: [
      'Supported an M.Tech project that logged and decoded live CAN traffic, mapping frames to vehicle functions in a DBC file.',
      'Helped test an AES-128 (Fernet) encryption proof-of-concept between two ECUs on a virtual CAN bus.',
    ],
    tools: ['Arduino Uno + MCP2515', 'Python', 'SocketCAN', 'DBC'],
  },
  {
    id: 'wheelchair',
    section: 'projects',
    label: 'Smart wheelchair',
    kicker: 'Team project',
    title: 'AI-Assisted Voice-Controlled Smart Wheelchair for Leprosy Patients',
    summary:
      'I worked on the electric powertrain and hardware integration of a voice-controlled wheelchair.',
    stats: [],
    points: [
      'Integrated the hub motor, motor controller, phase wiring and battery pack.',
      'Wired the Raspberry Pi control circuitry.',
      'Mounted the hub motor to the wheel assembly.',
    ],
    tools: ['Hub motor', 'Motor controller', 'Battery pack', 'Raspberry Pi'],
  },
  {
    id: 'patent',
    section: 'projects',
    label: 'Design patent',
    kicker: 'Design patent · Published',
    title: 'Waste-Sorting Dustbin with Ornamental Lid Support',
    summary: 'Co-inventor on a published Indian design patent.',
    stats: [],
    points: [
      'Rectangular body with softened edges.',
      'Hinged lid carried on side-mounted ornamental supports.',
      'Front panel with a recessed display and a microphone opening.',
    ],
    tools: ['Industrial design', 'Design patent'],
  },
  {
    id: 'matlab',
    section: 'projects',
    label: 'MATLAB experiments',
    kicker: 'Other projects',
    title: 'MATLAB and Simulink experiments',
    summary: 'Smaller simulation projects from coursework.',
    stats: [],
    points: [
      'Lightning-impulse effects on the bit error rate and signal-to-noise ratio of AM and PM systems.',
      'A 10-stage Marx generator producing a lightning-impulse waveform.',
      'A smart-meter GUI for time-of-use tariffs with demand-side management.',
    ],
    tools: ['MATLAB', 'Simulink'],
  },
  {
    id: 'cbc',
    section: 'experience',
    label: 'CI/CD at CBC',
    kicker: 'Internship · 2026 – present · Remote',
    title: 'Agentic AI Engineer Intern, CBC Inc. (CloudBC Labs)',
    summary: 'Reston, Virginia. I built the CI/CD pipeline for ACS, the company’s AI candidate-screening platform, then tested it end to end. Now starting work on demand planning.',
    stats: [],
    points: [
      'Built the automated build, test and deploy flow for ACS.',
      'Tested the pipeline end to end.',
      'Now starting work on demand planning.',
    ],
    tools: ['CI/CD pipelines', 'Python'],
  },
  {
    id: 'vinadith',
    section: 'experience',
    label: 'Panel wiring internship',
    kicker: 'Internship · Apr – May 2026',
    title: 'Electrical Engineering Intern, Vinadith Corporation',
    summary: 'Bengaluru. Industrial motor-control panels, from drawing to build.',
    stats: [],
    points: [
      'Wired and assembled power and control circuits for heavy-duty motor feeder systems used in industrial mill applications.',
      'Drew electrical schematics and control-panel layouts in AutoCAD and EPLAN, and followed designs through build at panel fabrication centres.',
    ],
    tools: ['AutoCAD', 'EPLAN', 'Motor feeder circuits', 'Control panels'],
  },
  {
    id: 'skills',
    section: 'skills',
    label: 'Skills shelf',
    kicker: 'Skills',
    title: 'What I work with',
    summary: '',
    stats: [],
    groups: [
      { name: 'Controls and simulation', list: 'MATLAB, Simulink, Simscape Multibody, Vehicle Dynamics Blockset, Reinforcement Learning Toolbox, MPC, system identification' },
      { name: 'Vehicle systems', list: 'ADAS (adaptive cruise, lane keeping), vehicle dynamics (14-DOF, yaw control, torque vectoring), CAN bus, haptic shared control' },
      { name: 'Programming and embedded', list: 'Python, Arduino, Raspberry Pi, CI/CD pipelines, LaTeX; learning embedded C' },
      { name: 'Electrical design', list: 'AutoCAD, EPLAN, motor feeder and control circuits, control-panel layouts, Blender 3D' },
    ],
    tools: [],
  },
  {
    id: 'education',
    section: 'education',
    label: 'Education',
    kicker: 'Education',
    title: 'B.Tech, Electrical and Electronics Engineering',
    summary: 'CHRIST (Deemed to be University), Bengaluru. Expected 2027.',
    stats: [],
    points: [
      'Pre-University Course: Sheshadripuram Independent PU College, 2022–2023.',
      'Schooling: Holy Angels High School, 2020.',
      'Certificate: Automation and Data Sciences, CHRIST University and NSP Global.',
      'Certificate: MATLAB/Simulink Bible, Udemy.',
      'Line-following robot, Engineer’s Day exhibition, CHRIST University.',
    ],
    tools: [],
  },
  {
    id: 'about',
    section: 'about',
    label: 'About me',
    kicker: 'About',
    title: 'Tejas V Gowda',
    summary: profile.summary,
    stats: [],
    points: [],
    tools: [],
    contact: true,
  },
  {
    id: 'resume',
    section: 'resume',
    label: 'Resume',
    kicker: 'Resume',
    title: 'One page, everything on it',
    summary: 'Download the PDF, or read the same content as a plain page.',
    stats: [],
    points: [],
    tools: [],
    resume: true,
  },
];

// The order used by the "Next" button in the side panel.
export const tourOrder = ['tja', 'mpc', 'can', 'wheelchair', 'patent', 'matlab', 'cbc', 'vinadith', 'skills', 'education', 'about', 'resume'];
