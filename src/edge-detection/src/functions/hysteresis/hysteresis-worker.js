onmessage = function (e) {
    let msg = e.data;
    self.postMessage(HysteresisEdgeTracking(msg.array, msg.info));
};

function HysteresisEdgeTracking(magnitude, info) {
    let result = [];
    let width = info.width;
    let count = 0;

    let lowToHigh = 255;

    for (let i = 0; i < magnitude.length; i++) {
        if (magnitude[i] === 255) {
            result[i] = 255;
            continue;
        } else if (magnitude === 25) {
            if (magnitude[i - 1] === 255) {
                // left
                result[i] = lowToHigh;
            } else if (magnitude[i - width] === 255) {
                // top
                result[i] = lowToHigh;
            } else if (magnitude[i + width] === 255) {
                // bottom
                result[i] = lowToHigh;
            } else if (magnitude[i + 1] === 255) {
                // right
                result[i] = lowToHigh;
            } else if (magnitude[i - width + 1] === 255) {
                // top right
                result[i] = lowToHigh;
            } else if (magnitude[i - width - 1] === 255) {
                // top left
                result[i] = lowToHigh;
            } else if (magnitude[i + width - 1] === 255) {
                // bottom left
                result[i] = lowToHigh;
            } else if (magnitude[i + width + 1] === 255) {
                // bottom right
                result[i] = lowToHigh;
            }
        } else {
            result[i] = 0;
            count += 1;
        }
    }

    return result;
}
