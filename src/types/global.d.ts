// [private key, public key]
type genKeyPair = () => [string, string];
type genPreKey = () => string;

export {};

declare global {
  interface Window {
    wgCtrl: {
      genKeyPair: genKeyPair;
      genPreKey: genPreKey;
    };
  }
}
