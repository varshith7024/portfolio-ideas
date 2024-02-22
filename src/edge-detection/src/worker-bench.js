onmessage = function (e) {
    let msg = e.data;
    self.postMessage('Hey');
};
