// source: <js-file>
// message: <message-to-be-sent>
function createWorker(source, message) {
    return new Promise((resolve, reject) => {
        let worker = new Worker(source);
        worker.postMessage(message);
        worker.onmessage = (event) => {
            resolve(event.data);
            worker.terminate();
        };
        worker.onerror = (error) => {
            reject(error.data);
        };
    });
}

export { createWorker };
