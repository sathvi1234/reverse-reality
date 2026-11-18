<div align="center">

# 🖐️ Reverse Reality — Hands of Creation

### *Two Hands. Two Forms. One Creation.*

A gesture-controlled 3D experience where players create two different forms with their hands, bring them together, and reveal a unique organic-geometric masterpiece.

[![Live Demo](https://img.shields.io/badge/Live_Demo-reverse--reality.vercel.app-00e5ff?style=for-the-badge&logo=vercel&logoColor=white)](https://reverse-reality.vercel.app/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://reverse-reality.vercel.app/)
[![Hand Tracking](https://img.shields.io/badge/Hand_Tracking-MediaPipe-7c4dff?style=for-the-badge)](https://developers.google.com/mediapipe)
[![3D](https://img.shields.io/badge/3D-iwsdk-ff4081?style=for-the-badge)](#technology)

### 🚀 [**Try it live → reverse-reality.vercel.app**](https://reverse-reality.vercel.app/)


</div>

---

## 📑 Table of Contents

- [About the Project](#about-the-project)
- [The Experience](#the-experience)
- [Gesture Controls](#gesture-controls)
- [Shape Library](#shape-library)
- [Fusion Creations](#fusion-creations)
- [Technology](#technology)
- [Getting Started](#getting-started)
- [Running the Project](#running-the-project)
- [Production Build](#production-build)
- [Deployment](#deployment)
- [Camera and Hand-Tracking Notes](#camera-and-hand-tracking-notes)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

**Reverse Reality — Hands of Creation** turns hand movement into a creative 3D interaction. Instead of using a keyboard or mouse to build an object, the player uses two hands to shape two different visual worlds:

| Hand | World | Result |
|------|-------|--------|
| 🤚 **Right hand** | Geometric World | Structured, angular and crystalline forms |
| ✋ **Left hand** | Organic World | Flowing, natural and expressive forms |
| 🙌 **Both hands** | Fusion | Bringing the hands together combines the two forms into one final creation |

The goal is to make the player feel as though they are sculpting light and matter in the air.


---

## The Experience

The application is designed around two distinct phases.

### 1. Landing Page

The landing page introduces the experience before the camera is requested. It features:

- Reverse Reality branding and the tagline **"Two Hands. Two Forms. One Creation."**
- A distinctive animated 3D organic-geometric centerpiece.
- A cinematic dark environment with atmospheric particles and cyan/violet lighting.
- A clear **Start Experience** call to action.
- A short explanation of the two-hand creation and fusion mechanic.

> The webcam does **not** start automatically on the landing page.



### 2. Hands of Creation Gameplay

After the player selects **Start Experience**, the application requests camera permission and initializes hand tracking. The player then:

1. Positions both hands in view of the camera.
2. Selects and creates a **geometric** form with the right hand.
3. Selects and creates an **organic** form with the left hand.
4. Confirms both forms and brings the hands together.
5. Watches the forms move, connect and transform into a combined 3D creation.
6. Sees a celebration screen with **"Congratulations!"**, a generated creation name and the two source shapes.
7. Starts another creation or returns to the landing page.


---

## Gesture Controls

The following is the intended interaction model. Exact finger-pose mappings and thresholds should be calibrated and documented alongside the implementation.

| Hand / Gesture | Intended action |
|----------------|-----------------|
| Right hand | Controls the geometric shape |
| Left hand | Controls the organic shape |
| Thumb-and-index pinch | Activate or select a shape |
| Finger configuration | Cycle through available shape choices |
| Open palm | Confirm the current shape or selection |
| Hand movement | Position or manipulate the selected form |
| Wrist rotation | Rotate the selected form, where supported |
| Both hands move closer | Trigger the fusion sequence once both shapes are ready |



The game provides on-screen guidance, clear tracking status and feedback when a gesture is recognized. Gesture recognition uses tracked landmarks rather than simulated input.

---

## Shape Library

The shape library supports many combinations and replay value.

<table>
<tr>
<td valign="top" width="50%">

### 🔷 Geometric World — Right Hand

- Cube
- Sphere
- Pyramid
- Cone
- Torus
- Cylinder
- Dodecahedron
- Icosahedron
- Octahedron
- Tetrahedron
- Diamond
- Crystal
- Star
- Spiral
- Helix
- Wireframe sculpture
- Geometric flower
- Abstract polyhedron

</td>
<td valign="top" width="50%">

### 🌿 Organic World — Left Hand

- Butterfly
- Rose
- Lotus
- Sunflower
- Lily
- Heart
- Leaf
- Tree
- Jellyfish
- Dragonfly
- Feather
- Shell
- Coral
- Mushroom
- Bird
- Fish
- Peacock-feather form
- Flowing organic sculpture

</td>
</tr>
</table>


Each option has a recognizable silhouette and its own geometry or procedural form — not merely a different label or color applied to the same model.

---

## Fusion Creations

When both shapes are confirmed, the fusion system uses the selected forms to influence the final geometry, materials and animation. Example outcomes include:

| | | |
|---|---|---|
| Crystal Butterfly | Galaxy Flower | Diamond Rose |
| Celestial Heart | Cosmic Tree | Neon Jellyfish |
| Aurora Lotus | Quantum Peacock | Eternal Bloom |
| Crystal Dragonfly | Solar Phoenix | Cosmic Planet |
| Infinity Sculpture | Galactic Coral | Stardust Butterfly |
| Living Geometry | | |


The final reveal includes:

- A large, centered 3D masterpiece.
- A visible particle and energy transformation.
- A **Congratulations!** message.
- A distinctive name generated for the creation.
- The names of the two source shapes.
- A short description of the result.
- **Create Again** and **Back to Home** actions.


A new name is never used to disguise an identical model: different shape pairs produce visibly different results.

---

## Technology

The project follows the architecture and packages already present in this repository:

- **3D scene and rendering:** the project's existing iwsdk / 3D scene pipeline.
- **Hand tracking:** a real browser-based hand-landmark tracker, such as MediaPipe Hand Landmarker, if that is the implementation configured in the project.
- **Camera input:** browser `getUserMedia` with permission and error handling.
- **Deployment:** Vercel or another HTTPS-capable static/web hosting platform, depending on the project's build output.

Check `package.json` and the installed dependencies for the exact framework, libraries and versions used by the current implementation. Do not add a second rendering or tracking stack without first checking what is already installed.

---

## Getting Started

### Prerequisites

- Node.js (use the version supported by the project's dependencies; check `package.json` and any `.nvmrc` / `.node-version` file).
- npm, or the package manager indicated by the lockfile.
- A webcam for real hand tracking.
- A modern browser with camera access enabled.

### Clone the Repository

Replace the placeholder with the actual repository URL:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd reverse-reality
```

### Install Dependencies

```bash
npm install
```

On Windows PowerShell, the same command works. If the repository uses `pnpm-lock.yaml`, `yarn.lock` or another lockfile, use that package manager instead of npm.

---

## Running the Project

Start the development server with:

```bash
npm run dev
```

On Windows, this also works:

```bash
npm.cmd run dev
```

Open the local URL printed in the terminal. The current development setup has previously used:

```
https://localhost:8081/
```

Use the URL printed by the running server if the port or protocol has changed. Keep the terminal process running while using the local application.

To see the scripts available in the project, run:

```bash
npm run
```

---

## Production Build

Before deploying, run the build script defined by the project:

```bash
npm run build
```

If the project provides a preview script, use it to test the production build locally:

```bash
npm run preview
```

The exact build and output settings must match the scripts and framework configuration in `package.json` and the project config files. Resolve build errors before deployment.

---

## Deployment

🌐 **Live site:** [https://reverse-reality.vercel.app/](https://reverse-reality.vercel.app/)

The project is deployed through Vercel. To deploy your own copy:

1. Push the project to a GitHub repository.
2. Sign in to Vercel and import that repository.
3. Allow Vercel to detect the framework, or set the framework preset, build command and output directory to match the project configuration.
4. Add any required environment variables in Vercel's project settings. Never commit secrets or `.env` files.
5. Deploy and open the HTTPS deployment URL.
6. Test the deployed site on the intended browser and device.

### Deployment Checklist

- [ ] Production build completes successfully.
- [ ] Landing page loads and looks correct.
- [ ] Camera is not requested until Start Experience is selected.
- [ ] Camera permission and denial states are handled.
- [ ] Both hands can be detected at the same time.
- [ ] Right-hand geometric selection and manipulation work.
- [ ] Left-hand organic selection and manipulation work.
- [ ] Bringing both hands together triggers fusion only when both shapes are ready.
- [ ] Different shape pairs produce distinguishable creations.
- [ ] Congratulations screen, generated name and replay controls work.
- [ ] No critical browser-console or deployment errors remain.

---

## Camera and Hand-Tracking Notes

Browsers generally restrict camera access to secure contexts. Use HTTPS for hosted deployments and `localhost` for local development. The player must grant camera permission.

For reliable two-hand interaction:

- Request access to the camera only after the player starts the experience.
- Clearly show whether the camera is waiting, active, blocked or unavailable.
- Track both hands and their handedness consistently.
- Smooth landmark movement to reduce jitter without introducing excessive lag.
- Calibrate the interaction area and fusion threshold for the camera's field of view.
- Handle temporary hand loss and occlusion without unexpectedly moving or fusing objects.
- Provide a retry path if camera initialization fails.

> Do not describe camera processing as local-only or make privacy guarantees unless the actual tracking and data-flow implementation has been verified.

---

## Troubleshooting

<details>
<summary><b>The camera does not start</b></summary>

- Open the application using its HTTPS deployment URL or local development URL.
- Check that the browser has camera permission for the site.
- Check whether another application is using the webcam.
- Confirm that a camera device is available.
- Reload the page and use the in-app camera retry action, if available.

</details>

<details>
<summary><b>The hands are not detected</b></summary>

- Improve lighting and keep both hands inside the camera frame.
- Avoid covering the fingertips for long periods.
- Check the hand-tracking model and asset loading in the browser console and network panel.
- Confirm that the tracker is configured to detect two hands.

</details>

<details>
<summary><b>The development server does not start</b></summary>

- Check the terminal for the first reported error.
- Confirm the required Node.js version.
- Install dependencies using the package manager associated with the lockfile.
- Run `npm run` to confirm that the expected dev script exists.

</details>

<details>
<summary><b>The deployment loads a blank page</b></summary>

- Inspect the browser console and Vercel deployment build logs.
- Check the framework's output directory and any base-path configuration.
- Confirm that required public assets and model files are included in the production build.
- Check environment variables and runtime asset URLs.

</details>

---

## Project Structure

The exact structure can evolve as the implementation develops. A typical organization might look like this:

```
reverse-reality/
├── public/                 # Static assets, models and textures
├── docs/
│   └── screenshots/        # README images
├── src/                    # Application and gameplay source
│   ├── components/         # Landing page and interface components
│   ├── scene/              # 3D scene and object creation
│   ├── tracking/           # Camera and hand-tracking integration
│   ├── gestures/           # Gesture recognition and mapping
│   ├── fusion/             # Shape combination and reveal effects
│   └── styles/             # Visual styles
├── package.json
├── README.md
└── ...                     # Framework and scene configuration
```

This is an illustrative layout, not a claim about the current repository. Keep the actual project structure and its iwsdk conventions intact.

---

## Contributing

Contributions and ideas that improve gesture reliability, procedural shape variety, accessibility, performance and visual quality are welcome.

Before submitting changes:

1. Follow the repository's `AGENTS.md` instructions and established development workflow.
2. Preserve the existing scene schema and project architecture.
3. Run the available lint, test and production-build scripts.
4. Test camera access and both-hand interactions on a real device.
5. Describe any features that are incomplete or not yet verified.

---

## License

No license has been specified yet. Add a `LICENSE` file and update this section before distributing or accepting reuse of the project. Until then, do not assume that the source is licensed for reuse.

---

<div align="center">

### Reverse Reality — Hands of Creation
*Create with both hands. Discover something unexpected.*

🌐 [reverse-reality.vercel.app](https://reverse-reality.vercel.app/)

</div>
