import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class ModelLoader {
  constructor() {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    this._loader = new GLTFLoader();
    this._loader.setDRACOLoader(draco);
  }

  load(url, onProgress, onSuccess, onError) {
    this._loader.load(
      url,
      gltf => { onSuccess(gltf); },
      xhr  => {
        if (xhr.lengthComputable) onProgress(xhr.loaded / xhr.total);
      },
      err  => {
        if (onError) onError(err);
      }
    );
  }
}
