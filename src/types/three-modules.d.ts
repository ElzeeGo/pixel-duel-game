declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    
    update(): boolean;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { AnimationClip, Camera, Group, LoadingManager, Object3D, Scene } from 'three';

  export interface GLTF {
    animations: AnimationClip[];
    scene: Group;
    scenes: Group[];
    cameras: Camera[];
    asset: {
      copyright?: string;
      generator?: string;
      version?: string;
      minVersion?: string;
      extensions?: any;
      extras?: any;
    };
    parser: any;
    userData: any;
  }

  export class GLTFLoader {
    constructor(manager?: LoadingManager);
    
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    
    setDRACOLoader(dracoLoader: any): GLTFLoader;
    setKTX2Loader(ktx2Loader: any): GLTFLoader;
    setMeshoptDecoder(meshoptDecoder: any): GLTFLoader;
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
} 