onmessage = function (e) {
    let msg = e.data;
    self.postMessage(sobelConvolution(msg.array, msg.info));
};

function sobelConvolution(array, info) {
    let vertical = sobelConvolutionVertical(array, info);
    let horizontal = sobelConvolutionHorizontal(array, info);
    let result = [];
    let thetaArray = [];
    let count = 0;
    for (let i = 0; i < array.length; i++) {
        let magnitude = Math.floor(
            Math.sqrt(vertical[i] * vertical[i] + horizontal[i] * horizontal[i])
        );

        result[i] = Math.floor(magnitude);
        thetaArray[i] = Math.atan(vertical[i] / horizontal[i]);

        if (vertical[i] !== 0 && horizontal[i] === 0) {
            result[i] = 0;
            thetaArray[i] = 0;
        }
    }
    let retVal = {
        magnitude: result,
        edgeDirections: thetaArray,
    };
    return retVal;
}

function sobelConvolutionHorizontal(array, info) {
    let result = [];

    for (let i = 0; i < array.length; i++) {
        // copy-pasted from rust version
        if (
            i - 1 < 0 ||
            i + 1 > array.length - 1 ||
            i - info.width - 1 < 0 ||
            i - info.width + 1 < 0 ||
            i + info.width + 1 > array.length - 1 ||
            i + info.width > array.length - 1 ||
            i + info.width + 1 > array.length - 1 ||
            i - info.width - 1 < 0 ||
            i + info.width > array.length - 1
        ) {
            result.push(array[i]);
            continue;
        }

        let average = 0;

        // above
        average += array[i - info.width] * -2;
        // below
        average += array[i + info.width] * 2;
        // right
        average += array[i + 1] * 0;
        // left
        average += array[i - 1] * 0;
        // centre
        average += array[i] * 0;
        // Top left
        average += array[i - info.width - 1] * -1;
        // Top right
        average += array[i - info.width + 1] * -1;
        // Bottom left
        average += array[i + info.width - 1] * 1;
        // Bottom right
        average += array[i + info.width + 1] * 1;

        result.push(Math.floor(average));
    }

    for (let i = 0; i < array.length; i++) {
        result.push(255 - array[i]);
    }

    return result;
}

function sobelConvolutionVertical(array, info) {
    let result = [];

    for (let i = 0; i < array.length; i++) {
        // copy-pasted from rust version
        if (
            i - 1 < 0 ||
            i + 1 > array.length - 1 ||
            i - info.width - 1 < 0 ||
            i - info.width + 1 < 0 ||
            i + info.width + 1 > array.length - 1 ||
            i + info.width > array.length - 1 ||
            i + info.width + 1 > array.length - 1 ||
            i - info.width - 1 < 0 ||
            i + info.width > array.length - 1
        ) {
            result.push(array[i]);
            continue;
        }

        let average = 0;

        // above
        average += array[i - info.width] * 0;
        // below
        average += array[i + info.width] * 0;
        // right
        average += array[i + 1] * 2;
        // left
        average += array[i - 1] * -2;
        // centre
        average += array[i] * 0;
        // Top left
        average += array[i - info.width - 1] * -1;
        // Top right
        average += array[i - info.width + 1] * 1;
        // Bottom left
        average += array[i + info.width - 1] * -1;
        // Bottom right
        average += array[i + info.width + 1] * 1;

        result.push(Math.floor(average));
    }

    for (let i = 0; i < array.length; i++) {
        result.push(255 - array[i]);
    }

    return result;
}
