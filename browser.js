'use strict';

const server = "ws://localhost:8080";
const readData = new Uint8Array(0);
const writeData = new Uint8Array(16*1024*1024);

function log(text) {
  let logWindow = document.getElementById("logWindow");
  logWindow.appendChild(document.createTextNode(text));
  logWindow.appendChild(document.createElement("br"));
}

function defaultOnMessage(e) {
  log(`Received message with ${e.data.byteLength} bytes`);
}

window.onload = function() {
  let ws = new WebSocket(server);
  ws.binaryType = 'arraybuffer';
  ws.onopen = function() {
    log(`Opened connection to ${server}`);
  };
  ws.onerror = function(e) {
    log(`WebSocket error, current state ${ws.readyState}`);
  }
  ws.onclose = function() {
    log(`Closed connection to ${server}`);
  }
  ws.onmessage = this.defaultOnMessage;

  let send = async function (data) {
    return new Promise((resolve) => {
      ws.onmessage = function(event) {
        ws.onmessage = defaultOnMessage;
        resolve(new Uint8Array(event.data));
      }
      ws.send(data);
    });
  }

  let transfer = function(isWrite) {
    const action = isWrite ? 'write' : 'read';
    const dataToSend = isWrite ? writeData : readData;
    return async function() {
      const start = window.performance.now();
      let totalBytes = 0;

      const NUM_ITER = 5;
      log(`Running ${NUM_ITER} ${action} tests:`);

      for (let i=0; i<NUM_ITER; ++i) {
        log(`  ${i+1}`);
        const receivedData = await send(dataToSend);
        // only one of those is non-zero
        totalBytes += dataToSend.length + receivedData.length;
      }

      const time = window.performance.now() - start;
      log(`Done in ${time}ms, speed: ${(totalBytes / time / 1000.0).toFixed(2)}MBps`);
    }
  }

  document.getElementById('buttonRead').onclick = transfer(false);
  document.getElementById('buttonWrite').onclick = transfer(true);

  return false;
}
