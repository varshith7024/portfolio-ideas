onmessage = function (e) {
    let msg = e.data;
    self.postMessage(
        doubleThreshold(msg.array, msg.lowThreshold, msg.highThreshold)
    );
};

function doubleThreshold(magnitude, lowThreshold, highThreshold) {
    let high = highThreshold * 255;
    let low = lowThreshold * 255;

    const highValue = 255;
    const lowValue = 25;

    let result = [];

    for (let i = 0; i < magnitude.length; i++) {
        if (magnitude[i] > high) {
            result[i] = highValue;
        } else if (magnitude[i] < high && magnitude[i] > low) {
            result[i] = lowValue;
        } else {
            result[i] = 0;
        }
    }

    return result;
}
