# Kirana Change

## Game Overview

Kirana Change is a fun, educational web application simulating an Indian neighborhood grocery shop. Designed for children aged 7-10, it teaches how to calculate bills, understand Indian rupee denominations, and give the correct change.

## Main Features

- **Interactive 3D Kirana Store**: A rich, procedural 3D Indian neighborhood grocery shop built with Three.js. Features authentic red-and-white awning, traditional shop signboard ("🏪 CORNER GROCERY STORE 🏪"), marigold flower toran (garland), wooden shelving racks, glass candy jars, hanging snack packet strips, jute sacks filled with rice/lentils, stainless steel dabbas, a digital electronic weighing scale, red account ledger book, brass bell, and cutting chai glass.
- **Dynamic 3D Characters**: Includes the warm neighborhood shopkeeper (with curled handlebar mustache, kurta, Nehru vest, and gamcha) behind the counter and diverse animated 3D customers (Mrs. Priya, Mr. Sharma, Rohan, Meera & Anu, Raju, Grandma) with distinct outfits, accessories (bindi, spectacles, cap), and emotional reactions (celebratory jump/stars on correct change, thoughtful tilt on retry).
- **Synchronized Game State**: The 3D scene responds directly to the educational game state. When customers arrive, their 3D avatars appear at the counter with their payment on the desk. Selecting currency notes and coins instantly mirrors onto the 3D brass change tray on the counter in real time!
- **Progressive Difficulty**: 10 levels ranging from simple coin combinations to complex shopping carts and discounts.
- **Realistic Scenarios**: Encounter multiple customers, products, and dynamic scenarios where the given payment varies.
- **Hint System**: An easy-to-understand count-up hint system to guide players on how to make correct change.
- **English Interface**: Clean, accessible English language interface optimized for desktop and mobile displays.
- **Progression and Scoring**: Stars awarded based on accuracy and hint usage, with a persistent level map (saved to your browser's local storage).
- **Audio-Visual Feedback**: Delightful sound effects and animations to celebrate correct answers.

## Technologies Used

- **Framework**: React 19 with Vite and TypeScript
- **3D Engine**: Three.js (Procedural 3D Indian kirana store environment with custom lighting, materials, and animations)
- **Styling**: Tailwind CSS
- **Routing**: TanStack Router
- **Animations**: Framer Motion
- **Testing**: Vitest

## Installation Instructions

1. Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
2. Clone this repository to your local machine:
   ```bash
   git clone <this-repository-url>
   cd "Kirana Change"
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## How to Run the Development Server

To start the local development server:

```bash
npm run dev
```

Then, open the provided URL (usually `http://localhost:5173`) in your web browser.

## How to Run Tests

To run the automated test suite and ensure all game logic and calculations are correct:

```bash
npm run test
```

## How to Build for Production

To create a production-ready build:

```bash
npm run build
```

The optimized files will be located in the `dist` directory.

## Project Structure

- `src/game/engine.ts`: Contains the core game rules, scenarios generation, bill calculation, and hint logic.
- `src/components/game/`: Houses the game's UI elements like the CashDrawer, ChangeTray, HomeScreen, GameScreen, and HintPanel.
- `src/routes/`: Contains the TanStack Router configuration and the root entry points.
- `src/assets/`: Static assets like images.

## Scoring and Progression

- Players earn 1 to 3 stars per customer based on accuracy and whether hints were used.
- 3 stars: Perfect change without hints.
- 2 stars: Correct change with minimal mistakes or hint usage.
- 1 star: Completed after multiple mistakes.
- Completing a level unlocks the next one.
- Progress is automatically saved in your browser so you can continue where you left off.

## 3D Environment Architecture & Attribution

- **Procedural 3D Kirana Store**:
  - Engineered in `src/components/game/3d/` with Three.js.
  - Implements a low-poly stylized Indian neighborhood grocery shop featuring checkered tiled floors, wooden racks, glass candy canisters, jute sacks, hanging snack packet strips, steel dabbas, traditional accounting ledger book, and an electronic weighing scale.
  - Features real-time state synchronization: customer payment on the counter and the player's active change tray mirrored in 3D.
  - Evaluated candidate asset: _Indian Shop_ by anandmohan662 on Sketchfab (CC BY 4.0; 2,028 faces, requires authenticated API token for downloads). To ensure zero bundle bloat, zero network latency, full mobile compatibility, and 100% reactive character animations tailored to game scenarios, a procedural Three.js architecture was constructed directly.
  - Includes full WebGL support detection and responsive canvas resizing.
