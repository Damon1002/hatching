import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { THREE_BUNDLE_CODE } from '../data/threeBundleCode';

interface CubeLand3DViewProps {
  isFocusing?: boolean;
  progress?: number;
}

export function CubeLand3DView({ isFocusing = false, progress = 0 }: CubeLand3DViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const sceneSize = Math.min(windowWidth - 24, 340);
  const webViewRef = useRef<WebView>(null);
  const [modelReady, setModelReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus state update to WebGL scene
  useEffect(() => {
    if (webViewRef.current && modelReady) {
      webViewRef.current.injectJavaScript(`
        if (window.setFocusState) {
          window.setFocusState(${isFocusing}, ${progress});
        }
        true;
      `);
    }
  }, [isFocusing, progress, modelReady]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MODEL_LOADED') {
        setModelReady(true);
      } else if (data.type === 'ERROR') {
        console.warn('[3D GLB Error]', data.error);
        setErrorMessage(data.error);
      } else if (data.type === 'LOG') {
        console.log('[3D GLB Log]', data.msg);
      }
    } catch (e) {
      // ignore
    }
  };

  const htmlContent = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
  </style>
  <script>
    ${THREE_BUNDLE_CODE}
  </script>
</head>
<body>
  <div id="canvas-container"></div>

  <script>
    function sendLog(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', msg: String(msg) }));
      }
    }
    function sendError(err) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: String(err) }));
      }
    }

    window.onerror = function(msg, url, line) {
      sendError(msg + ' at line ' + line);
    };

    (function() {
      try {
        var container = document.getElementById('canvas-container');
        var width = container.clientWidth || window.innerWidth || 340;
        var height = container.clientHeight || window.innerHeight || 340;

        // 1. Scene & Isometric Perspective Camera
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
        camera.position.set(5.5, 6.2, 7.5);
        camera.lookAt(0, 0.2, 0);

        // 2. WebGL Renderer with Alpha Transparency
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2.5));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(renderer.domElement);

        // 3. OrbitControls (Smooth 360 touch drag & rotation)
        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI * 0.18;
        controls.maxPolarAngle = Math.PI * 0.48;

        // 4. Studio Lighting for Blender GLTF Model
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
        scene.add(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xFFF6E0, 2.2);
        sunLight.position.set(7, 12, 6);
        scene.add(sunLight);

        var rimLight = new THREE.DirectionalLight(0x82C49B, 1.4);
        rimLight.position.set(-6, 4, -5);
        scene.add(rimLight);

        var fillLight = new THREE.DirectionalLight(0x3D7856, 0.9);
        fillLight.position.set(0, -6, 3);
        scene.add(fillLight);

        // 5. Model Container Group & Animation States
        var modelGroup = new THREE.Group();
        modelGroup.scale.set(0.001, 0.001, 0.001);
        modelGroup.rotation.y = -Math.PI * 1.5;
        scene.add(modelGroup);

        var isEntering = true;
        var entryProgress = 0;
        var targetRotY = 0.45;
        var currentFocusing = false;

        // 6. Load the EXACT cube-land.glb Blender Model
        var loader = new THREE.GLTFLoader();
        var modelUrl = '/assets/assets/models/cube-land.glb';

        loader.load(
          modelUrl,
          function(gltf) {
            try {
              var model = gltf.scene;

              // Compute bounding box to auto-center and normalize scale
              var box = new THREE.Box3().setFromObject(model);
              var size = box.getSize(new THREE.Vector3());
              var center = box.getCenter(new THREE.Vector3());

              model.position.x = -center.x;
              model.position.y = -center.y;
              model.position.z = -center.z;

              var maxDim = Math.max(size.x, size.y, size.z);
              var scaleFactor = 4.4 / maxDim;
              model.scale.setScalar(scaleFactor);

              modelGroup.add(model);

              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MODEL_LOADED' }));
              }
              sendLog('cube-land.glb parsed and loaded successfully!');
            } catch (err) {
              sendError('Model processing error: ' + err);
            }
          },
          undefined,
          function(err) {
            sendError('Failed to load cube-land.glb: ' + err);
          }
        );

        // 7. 60 FPS Render & Animation Loop
        var clock = new THREE.Clock();
        function animate() {
          requestAnimationFrame(animate);
          var delta = clock.getDelta();
          var elapsedTime = clock.getElapsedTime();

          controls.update();

          // A. Entry Animation (Elastic bounce pop-in & turntable spin)
          if (isEntering) {
            entryProgress += delta * 1.3;
            var t = Math.min(entryProgress, 1);
            var elasticScale = Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
            var currentScale = Math.max(0.001, Math.min(1.0, elasticScale));
            modelGroup.scale.set(currentScale, currentScale, currentScale);

            modelGroup.rotation.y += (targetRotY - modelGroup.rotation.y) * 0.08;

            if (t >= 1) {
              isEntering = false;
              modelGroup.scale.set(1, 1, 1);
            }
          } else {
            // B. Idle Floating Levitation & Subtle Sway
            var hoverY = Math.sin(elapsedTime * 1.5) * 0.08;
            var swayZ = Math.sin(elapsedTime * 0.9) * 0.02;
            modelGroup.position.y = hoverY;
            modelGroup.rotation.z = swayZ;

            // Auto slow turntable rotation when not dragging
            if (!controls.state || controls.state === -1) {
              modelGroup.rotation.y += 0.003;
            }
          }

          // C. Focus Mode Glow Transition
          if (currentFocusing) {
            sunLight.color.setHex(0xF3C766);
            ambientLight.intensity = 1.8 + Math.sin(elapsedTime * 2.0) * 0.2;
          } else {
            sunLight.color.setHex(0xFFF6E0);
            ambientLight.intensity = 1.6;
          }

          renderer.render(scene, camera);
        }
        animate();

        // Window Resize Listener
        window.addEventListener('resize', function() {
          var w = container.clientWidth || window.innerWidth;
          var h = container.clientHeight || window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });

        window.setFocusState = function(isFocusing, progress) {
          currentFocusing = isFocusing;
        };
      } catch (err) {
        sendError('Main setup error: ' + err);
      }
    })();
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <View style={[styles.container, { width: sceneSize, height: sceneSize }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{
          html: htmlContent,
          baseUrl: 'http://127.0.0.1:8081/',
        }}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowingReadAccessToURL={'*'}
        style={[styles.webView, { width: sceneSize, height: sceneSize }]}
        containerStyle={[styles.webViewContainer, { width: sceneSize, height: sceneSize }]}
        scrollEnabled={false}
        bounces={false}
        scalesPageToFit={true}
        onMessage={handleMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {!modelReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#82C49B" />
          <Text style={styles.loadingText}>载入 3D 浮空岛屿 (cube-land.glb)...</Text>
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  webViewContainer: {
    backgroundColor: 'transparent',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
