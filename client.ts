import * as WebSocket from 'ws';

const nsPerSec = 1e9;
const uri = 'ws://localhost:8080';
const ws = new WebSocket(uri);
const transferSize = 16*1024*1024;
const writeData = new Uint8Array(transferSize);
const readData = new Uint8Array(0);

function formatSpeed(bps: number): string {
    const i = Math.floor(Math.log(bps) / Math.log(1000));
    const units = ['Bps', 'kBps', 'MBps', 'GBps', 'TBps'];
    return (bps / Math.pow(1000, i)).toFixed(1) + ' ' + units[i];
}

class Timer {
    private start = process.hrtime();

    public elapsedInSec(): number {
        const elapsed = process.hrtime(this.start);
        return elapsed[0] + elapsed[1] / nsPerSec;
    }
}

async function waitMessage(length: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        ws.on('message', (data: WebSocket.Data) => {
            const buffer = (data as ArrayBuffer);
            if (buffer.byteLength === length) {
                resolve();
            } else {
                reject(new Error(`Unexpected message size ${buffer.byteLength}, want ${length}`));
            }
        });
    });
}

async function read(): Promise<void> {
    ws.send(readData);
    await waitMessage(transferSize);
}

async function write(): Promise<void> {
    ws.send(writeData);
    await waitMessage(0);
}

async function measure(f: () => Promise<void>, name: string): Promise<void> {
    const timer = new Timer();
    await f();
    const sec = timer.elapsedInSec();
    const speed = formatSpeed(transferSize / sec);
    console.log(`${name}\n\ttime: ${sec.toFixed(3)} sec\n\tspeed: ${speed}`);
}

ws.on('open', async () => {
    console.log(`opened connection with ${uri}`);

    await measure(read, 'read');

    await measure(write, 'write');
});
