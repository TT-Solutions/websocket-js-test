'use strict';

const server = "ws://localhost:8080";
const readData = new Uint8Array(0);
const writeData = new Uint8Array(16*1024*1024);

function log(text) {
  let logWindow = document.getElementById("logWindow");
  const child = logWindow.appendChild(document.createTextNode(text));
  logWindow.appendChild(document.createElement("br"));
  return child;
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
      const NUM_ITER = 5;
      const progress = log(`Running ${NUM_ITER} ${action} tests: `);

      const start = window.performance.now();

      // compute the mean and the standard deviation on the fly using the
      // algorithm from TAoCP Vol 2, section 4.2.2.
      let speedMin, speedMax, lastM, lastS;

      for (let i=0; i<NUM_ITER; ++i) {
        progress.nodeValue += '.';

        const startThis = window.performance.now();

        const receivedData = await send(dataToSend);

        const timeThis = window.performance.now() - startThis;

        // only one of those is non-zero
        const bytesXfered = dataToSend.length + receivedData.length;

        const speedThis = bytesXfered / 1000.0 / timeThis;

        if (i == 0) {
          speedMin =
          speedMax = speedThis;

          lastM = speedThis;
          lastS = 0;
        } else {
          if (speedThis < speedMin)
            speedMin = speedThis;
          if (speedThis > speedMax)
            speedMax = speedThis;

          const oldM = lastM;
          lastM += (speedThis - oldM)/(i + 1);
          lastS += (speedThis - oldM)*(speedThis - lastM);
        }
      }

      const time = window.performance.now() - start;

      progress.nodeValue += ' done';

      const f2 = (x) => x.toFixed(2);
      log(`Elapsed: ${time}ms, avg speed: ${f2(lastM)}MBps, std dev ${f2(Math.sqrt(lastS/(NUM_ITER - 1)))},  min/max: ${f2(speedMin)}/${f2(speedMax)}`);
    }
  }

  document.getElementById('buttonRead').onclick = transfer(false);
  document.getElementById('buttonWrite').onclick = transfer(true);

  return false;
}
