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
      console.time(action);
      for (let i=0; i<5; ++i) {
        console.time('while');
        console.time('send');
        const receivedData = await send(dataToSend);
        console.timeEnd('send');
        const message = `Finished (send ${dataToSend.length} bytes, receive ${receivedData.length} bytes)`;
        log(message);
        console.log(message);
        console.timeEnd('while');
      }
      console.timeEnd(action);
    }
  }

  document.getElementById('buttonRead').onclick = transfer(false);
  document.getElementById('buttonWrite').onclick = transfer(true);

  return false;
}
