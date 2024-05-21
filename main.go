//go:build js && wasm

package main

import (
	"syscall/js"

	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

func main() {
	wait := make(chan struct{}, 0)
	js.Global().Set("wgCtrl", js.ValueOf(map[string]interface{}{
		"genKeyPair": js.FuncOf(genKeyPair),
		"genPreKey":  js.FuncOf(genPreKey),
	}))
	<-wait
}

func genPreKey(this js.Value, args []js.Value) any {
	preKey, _ := wgtypes.GenerateKey()
	return js.ValueOf(preKey.String())
}

func genKeyPair(this js.Value, args []js.Value) any {
	if len(args) > 0 {
		key, err := wgtypes.ParseKey(args[0].String())
		if err != nil {
			return js.ValueOf(
				map[string]any{
					"error": err.Error(),
				},
			)
		}
		return js.ValueOf([]any{key.String(), key.PublicKey().String()})
	}

	privateKey, _ := wgtypes.GeneratePrivateKey()
	publicKey := privateKey.PublicKey()

	return js.ValueOf([]any{privateKey.String(), publicKey.String()})
}
