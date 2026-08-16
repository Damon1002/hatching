# 3D Asset Import & Rendering Workflow Guide
**Hatch Dragon (iOS / React Native + Three.js WebGL Engine)**

This document standardizes the exact end-to-end pipeline for importing 3D models (terrains, dragons, eggs, props) from 3D modeling tools (Blender, Maya, ZBrush) into the iOS application.

---

## 🏗️ 1. Asset Creation & Blender Export Settings

### Target Format: `.glb` (glTF 2.0 Binary)
GLB is the required format because it packages meshes, materials, embedded textures, armatures, and skeletal animation clips into a single binary stream.

### Blender Export Checklist:
When exporting from Blender (`File` → `Export` → `glTF 2.0 (.glb)`):

1. **Format:** `glTF Binary (.glb)`
2. **Include:**
   - [x] `Selected Objects` (Avoid exporting lights/cameras from Blender)
   - [x] `Custom Properties`
3. **Transform:**
   - `+Y Up` (Standard for Three.js and OpenGL)
4. **Geometry:**
   - [x] `Apply Modifiers`
   - [x] `UVs`
   - [x] `Normals`
   - [x] `Tangents` (if using normal maps)
5. **Materials:**
   - `Export Materials`: `Export`
   - `Images`: `Automatic` (Embedded PNG/JPEG, maximum $1024 \times 1024$ or $2048 \times 2048$ baked texture atlas)
6. **Animation (For Rigged Dragons / Eggs):**
   - [x] `Animations`
   - [x] `Shape Keys` (if facial blendshapes exist)
   - [x] `Skinning` (Armature bones & vertex weights)
   - [x] `NLA Tracks` & `Group by NLA Track` (Export distinct named actions: `idle`, `sleep`, `hatch`, `fly`, `celebrate`)

---

## 📁 2. File Placement & Metro Configuration

1. **Place Model:**
   Save the exported `.glb` file into the models folder:
   ```
   assets/models/<model-name>.glb
   ```
   *(e.g., `assets/models/cube-land.glb`, `assets/models/dragon-egg.glb`, `assets/models/red-dragon-animated.glb`)*

2. **Metro Asset Resolver:**
   Ensure `metro.config.js` has `glb` and `gltf` in `assetExts`:
   ```javascript
   const { getDefaultConfig } = require('expo/metro-config');
   const config = getDefaultConfig(__dirname);
   config.resolver.assetExts.push('glb', 'gltf');
   module.exports = config;
   ```

---

## ⚙️ 3. The 3D Rendering Architecture (Zero IPC Overhead)

### ⛔ NEVER DO THIS (Anti-Pattern):
- ❌ Do **not** convert the `.glb` file to Base64 in JavaScript.
- ❌ Do **not** pass multi-megabyte strings over React Native's `postMessage` IPC bridge.

### ✅ ALWAYS DO THIS (Production Standard):
1. **Direct Stream Loading:**
   Let Three.js `GLTFLoader` stream the binary asset directly via HTTP stream (development: Metro asset URL) or local file path (production).
2. **Offline Bundled Engine:**
   Use the pre-bundled Three.js runtime (`src/data/threeBundleCode.ts`) which includes `Three.js`, `GLTFLoader`, and `OrbitControls` with zero external CDN dependency.
3. **CORS & WKWebView Origin:**
   Configure `WebView` with `baseUrl: 'http://127.0.0.1:8081/'` and `allowUniversalAccessFromFileURLs={true}` so binary streaming is treated as same-origin.

---

## 🧩 4. Component Implementation Pattern

When creating a new 3D view component (e.g., `src/components/<Feature>3DView.tsx`):

```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { THREE_BUNDLE_CODE } from '../data/threeBundleCode';

interface Model3DProps {
  animationState?: 'idle' | 'focus' | 'hatch' | 'celebrate';
  isFocusing?: boolean;
}

export function Model3DView({ animationState = 'idle', isFocusing = false }: Model3DProps) {
  const webViewRef = useRef<WebView>(null);
  const [modelReady, setModelReady] = useState(false);

  // Send lightweight control commands to WebGL scene
  useEffect(() => {
    if (webViewRef.current && modelReady) {
      webViewRef.current.injectJavaScript(`
        if (window.setAnimationState) {
          window.setAnimationState("${animationState}", ${isFocusing});
        }
        true;
      `);
    }
  }, [animationState, isFocusing, modelReady]);

  const htmlContent = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; }
    html, body, #canvas-container { width: 100%; height: 100%; overflow: hidden; background: transparent; }
  </style>
  <script>${THREE_BUNDLE_CODE}</script>
</head>
<body>
  <div id="canvas-container"></div>
  <script>
    (function() {
      var container = document.getElementById('canvas-container');
      var width = container.clientWidth || window.innerWidth;
      var height = container.clientHeight || window.innerHeight;

      // 1. Scene, Camera & Renderer
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
      camera.position.set(5.5, 6.2, 7.5);
      camera.lookAt(0, 0.2, 0);

      var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(renderer.domElement);

      // 2. Interactive Orbit Controls
      var controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = false;
      controls.enablePan = false;

      // 3. Lighting System
      var ambient = new THREE.AmbientLight(0xffffff, 1.6);
      scene.add(ambient);
      var sun = new THREE.DirectionalLight(0xfff6e0, 2.2);
      sun.position.set(7, 12, 6);
      scene.add(sun);

      // 4. Model & Animation Setup
      var modelGroup = new THREE.Group();
      scene.add(modelGroup);

      var mixer = null;
      var actions = {};
      var currentAction = null;

      var loader = new THREE.GLTFLoader();
      loader.load('/assets/assets/models/<model-name>.glb', function(gltf) {
        var model = gltf.scene;

        // Auto-center & normalize scale
        var box = new THREE.Box3().setFromObject(model);
        var center = box.getCenter(new THREE.Vector3());
        var size = box.getSize(new THREE.Vector3());
        model.position.set(-center.x, -center.y, -center.z);
        var maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(4.4 / maxDim);
        modelGroup.add(model);

        // Setup Animation Mixer (if animations exist)
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach(function(clip) {
            actions[clip.name.toLowerCase()] = mixer.clipAction(clip);
          });
          if (actions['idle']) {
            currentAction = actions['idle'];
            currentAction.play();
          }
        }

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MODEL_LOADED' }));
        }
      });

      // 5. Animation Cross-Fade Control
      window.setAnimationState = function(stateName, isFocusing) {
        var targetAction = actions[stateName.toLowerCase()];
        if (targetAction && currentAction !== targetAction) {
          targetAction.reset().fadeIn(0.4).play();
          if (currentAction) currentAction.fadeOut(0.4);
          currentAction = targetAction;
        }
      };

      // 6. Render Loop
      var clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        var delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
    })();
  </script>
</body>
</html>
  `, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'http://127.0.0.1:8081/' }}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        style={styles.webView}
        scrollEnabled={false}
        onMessage={(e) => {
          const data = JSON.parse(e.nativeEvent.data);
          if (data.type === 'MODEL_LOADED') setModelReady(true);
        }}
      />
      {!modelReady && (
        <View style={StyleSheet.absoluteFill}>
          <ActivityIndicator size="large" color="#82C49B" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 340, height: 340, overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: 'transparent' },
});
```

---

## 🔄 5. Communication Bridge Protocol (Telemetry & Controls)

Always keep IPC messages lightweight. Supported message structures:

### React Native → WebGL (Commands via `injectJavaScript`):
* `setAnimationState(name: string, isFocusing: boolean)`: Triggers clip cross-fading (*Idle* $\rightarrow$ *Sleep* $\rightarrow$ *Hatch*).
* `setFocusProgress(progress: number)`: Adjusts ambient scene lighting, aura glow, or egg cracking shader.
* `triggerHatchEffect()`: Spawns particle bursts or initiates celebratory turntable spin.

### WebGL → React Native (Events via `window.ReactNativeWebView.postMessage`):
* `{ type: 'MODEL_LOADED' }`: Signals completion of shader compilation and texture uploads.
* `{ type: 'ANIMATION_COMPLETED', action: 'hatch' }`: Signals completion of one-shot animation to trigger level-up UI/Haptics.
* `{ type: 'ERROR', error: string }`: Forwards WebGL shader/runtime errors to React Native console.

---

## 🧪 6. Verification & Simulator QA Checklist

When introducing any new 3D model, run this standard verification protocol:

1. **TypeScript Typecheck:**
   ```bash
   npm run typecheck
   ```
2. **iOS Bundle Verification:**
   ```bash
   npm run verify:ios
   ```
3. **Hard Relaunch in Simulator:**
   ```bash
   xcrun simctl terminate booted host.exp.Exponent
   xcrun simctl openurl booted exp://127.0.0.1:8081
   ```
4. **Visual Verification:**
   Capture screenshot via `simctl`:
   ```bash
   xcrun simctl io booted screenshot <path-to-screenshot>.png
   ```
