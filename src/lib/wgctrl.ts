// only for type safe
declare class Go {
  importObject: WebAssembly.Imports;

  run(instance: WebAssembly.Instance): Promise<void>;
}

export async function loadWgCtrl(): Promise<void> {
  if (window.wgCtrl) return Promise.resolve();

  const go = new Go();
  const WASM_URL = '/main.wasm';

  try {
    const result = await WebAssembly.instantiateStreaming(
      fetch(WASM_URL),
      go.importObject,
    );
    void go.run(result.instance);
  } catch (err) {
    return Promise.reject(err);
  }

  return Promise.resolve();
}
