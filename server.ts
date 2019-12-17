import * as WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });
const readData = new Uint8Array(16*1024*1024);
const writeData = new Uint8Array(0);

wss.on('connection', function connection(ws) {
    console.log('connected');
    ws.on('message', (data: WebSocket.Data) => {
        const buffer = (data as ArrayBuffer);
        console.log(`message with ${buffer.byteLength} bytes`);
        if (buffer.byteLength === 0) {
            ws.send(readData);
        } else {
            ws.send(writeData);
        }
    });
});

console.log(`server now running on port ${wss.options.port}`);
