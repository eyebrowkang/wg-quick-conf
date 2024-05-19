# WireGuard Quick Config

## 项目简介 (Project Introduction)
这个项目用于快速生成 WireGuard 的配置，具有以下特色：
- **安全性**：使用 WireGuard 官方的 Go 库。
- **WebAssembly**：在浏览器客户端生成 WireGuard 密钥，确保密钥不会通过网络传输。
- **无服务器依赖**：纯粹的客户端操作，不需要任何接口请求。

This project is designed for quickly generating WireGuard configurations with the following features:
- **Security**: Utilizes the official WireGuard Go library.
- **WebAssembly** : Generates WireGuard keys in the browser client, ensuring the keys are not transmitted over the network.
- **Serverless** : Purely client-side operation with no interface requests needed.

## 开发 (Development)
### 前提条件 (Prerequisites)
- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)
- [Go](https://go.dev)
- [tinygo](https://tinygo.org/getting-started/install/)

### 编译WebAssembly (compile WebAssembly)
1. 获取tinygo的`wasm_exec.js`文件 (Get the `wasm_exec.js` file from tinygo)
```shell
tinygo version
# tinygo version 0.31.2 darwin/arm64 (using go version go1.21.1 and LLVM version 17.0.1)
cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" ./public/
```
2. 编译`main.go`文件 (Compile the `main.go` file)
```shell
tinygo build -o ./public/main.wasm -target wasm ./main.go
```

### 运行开发服务器 (Run DevServer)
1. 安装依赖 (Install dependencies)
```shell
pnpm install
```
2. 启动开发服务器 (Start the development server)
```shell
pnpm dev
```

# 许可证 (License)

该项目基于 MIT 许可证发布。有关详细信息，请参阅 [LICENSE](./LICENSE) 文件。

This project is licensed under the MIT License. For more details, please refer to the [LICENSE](./LICENSE) file.
