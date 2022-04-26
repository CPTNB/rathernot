./node_modules/.bin/esbuild rnos/server.js --bundle --outfile=server-stub.js --platform=node
mv server-stub.js cli/build/server.js
cd ./swc/service-injection
cargo build --target=wasm32-wasi
cp target/wasm32-wasi/debug/service_injection.wasm ../../cli/build