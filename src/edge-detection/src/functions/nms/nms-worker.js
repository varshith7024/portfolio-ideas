onmessage = function (e) {
    let msg = e.data;
    self.postMessage(
        NonMaximumSupression(msg.magnitude, msg.direction, msg.info)
    );
};

function NonMaximumSupression(magnitude, direction, info) {
    let width = info.width;
    let height = info.height;
    let result = [];
    let pi = Math.PI;
    let count = 0;
    for (let i = 0; i < magnitude.length; i++) {
        if (magnitude[i] !== 0) {
            let q = 0;
            let r = 0;
            if (direction[i] > 0 && direction[i] < pi / 4) {
                q = magnitude[i + 1];
                r = magnitude[i - 1];
            } else if (direction[i] >= pi / 4 && direction[i] < pi / 2) {
                q = magnitude[i + width + 1];
                r = magnitude[i - width - 1];
            } else if (direction[i] >= -pi / 2 && direction[i] < -pi / 4) {
                q = magnitude[i + width - 1];
                q = magnitude[i - width + 1];
            } else if (direction[i] >= -pi / 4 && direction[i] <= 0) {
                q = magnitude[i + width];
                q = magnitude[i - width];
            } else {
                if (count < 10000000 && !isNaN(direction[i])) {
                    console.log(direction[i]);
                }
                count += 1;
            }
            if (magnitude[i] > q && magnitude[i] > r) {
                result[i] = magnitude[i];
            } else {
                result[i] = 0;
            }
            continue;
        } else {
            result[i] = 0;
        }
    }
    return result;
}
