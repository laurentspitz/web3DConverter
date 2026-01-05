# 3D Tools & Optimizer 🚀

A premium web-based tool for converting STL files to GLB and optimizing existing GLB/glTF models using Draco compression. Built with a focus on performance, aesthetics, and privacy (all processing happens locally in the browser).

## ✨ Features

- **STL to GLB Conversion**: Seamlessly transform STL files into modern, efficient GLB models.
- **GLB Compression**: Drastically reduce file sizes of existing GLB models with adjustable Draco quantization.
- **Real-time 3D Comparison**: A split-screen preview allows you to compare the original (Turquoise) and optimized (Green) models side-by-side.
- **Internationalization (i18n)**: Fully localized in 5 languages:
  - 🇫🇷 Français
  - 🇺🇸 English
  - 🇪🇸 Español
  - 🇩🇪 Deutsch
  - 🇮🇹 Italiano
- **Custom Premium UI**: A glassmorphic design featuring a specialized language picker with SVG flags for consistent rendering across all platforms.
- **100% Privacy**: No files are uploaded to any server. All processing is done locally via WebWorkers and Three.js.

## 🛠 Tech Stack

- **Core**: [Three.js](https://threejs.org/) (Rendering, STL/GLB Loaders & Exporters)
- **Optimization**: [@gltf-transform](https://gltf-transform.dev/) for Draco compression and scene optimization.
- **Styling**: Vanilla CSS with modern Glassmorphism techniques and Google Fonts (Outfit).
- **i18n**: Custom lightweight translation system with dynamic UI updates.

## 🏗 Architecture

The project follows a clean, modular structure:

- `index.html`: Main application structure and SEO-optimized meta tags.
- `app.js`: Application logic, state management, and UI event handling.
- `ModelReader.js`: **NEW** Dedicated service for handling 3D model loading, normalization, materials, and geometry statistics.
- `translations.js`: Centralized dictionary for all supported languages.
- `style.css`: Comprehensive design system with responsive layout and animations.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Navigate to the project directory:
   ```bash
   cd web_converter
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Usage

1. Select your mode: **STL to GLB** or **Compress GLB**.
2. Drag and drop your file or click to browse.
3. Adjust compression settings (Draco 1-20 bits).
4. Click **Convert** or **Update Optimization** to see the results.
5. Use the split-screen slider to inspect the visual fidelity.
6. Click **Download .GLB** to save your optimized model.

---
*Built with ❤️ for the 3D Community.*
