'use strict';

const server = "ws://localhost:8989";
const transferSize = 16*1024*1024;
const readData = new Uint8Array(0);
const writeData = new Uint8Array(transferSize);
const msPerSec = 1e3;

function formatSpeed(bps) {
  const i = Math.floor(Math.log(bps) / Math.log(1000));
  const units = ['Bps', 'kBps', 'MBps', 'GBps', 'TBps'];
  return (bps / Math.pow(1000, i)).toFixed(1) + ' ' + units[i];
}

class Timer {
  constructor() {
    this.start = performance.now();
  }

  elapsedInSec() {
    return (performance.now() - this.start) / msPerSec;
  }
}

async function waitMessage(ws, length) {
  return new Promise((resolve, reject) => {
      ws.onmessage = async (data) => {
        const array = new Uint8Array(event.data);
        if (array.byteLength === length) {
            resolve();
        } else {
            reject(new Error(`Unexpected message size ${array.byteLength}, want ${length}`));
        }
      };
  });
}

async function read(ws) {
  ws.send(readData);
  await waitMessage(ws, transferSize);
}

async function write(ws) {
  ws.send(writeData);
  await waitMessage(ws, 0);
}

async function measure(f, ws, name) {
  const timer = new Timer();
  const count = 10;
  for (let i=0; i<count; ++i) {
    await f(ws);
  }
  const sec = timer.elapsedInSec();
  const speed = formatSpeed(count * transferSize / sec);
  log(`${name} in ${sec.toFixed(3)} sec at ${speed}`);
}

function log(text) {
  let logWindow = document.getElementById("logWindow");
  logWindow.appendChild(document.createTextNode(text));
  logWindow.appendChild(document.createElement("br"));
}

window.onload = () => {
  let ws = new WebSocket(server);
  ws.binaryType = 'arraybuffer';
  ws.onopen = () => {
    log(`Opened connection to ${server}`);
  };
  ws.onerror = (e) => {
    log(`WebSocket error, current state ${ws.readyState}`);
  }
  ws.onclose = () => {
    log(`Closed connection to ${server}`);
  }

  document.getElementById('buttonBench').onclick = async () => {
    await measure(read, ws, 'read');
    await measure(write, ws, 'write');
  };

  return false;
}
