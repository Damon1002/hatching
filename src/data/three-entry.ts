import * as THREE_MODULE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const THREE = {
  ...THREE_MODULE,
  GLTFLoader,
  OrbitControls,
};

if (typeof window !== 'undefined') {
  (window as any).THREE = THREE;
  (window as any).GLTFLoader = GLTFLoader;
  (window as any).OrbitControls = OrbitControls;
}

export { THREE, GLTFLoader, OrbitControls };
