onmessage = function (e) {
    let msg = e.data;
    self.postMessage(averageArray(msg.array, msg.info));
};

function averageArray(array, info) {
    let result = [];
    let blurSize = 3;
    let blurRadius = Math.floor(blurSize / 2);

    for (let i = 0; i < array.length; i++) {
        // copy-pasted from rust version
        if (
            i - blurRadius < 0 ||
            i + blurRadius > array.length - 1 ||
            i - info.width - blurRadius < 0 ||
            i - info.width + blurRadius < 0 ||
            i + info.width + blurRadius > array.length - 1 ||
            i + info.width > array.length - 1 ||
            i + info.width + blurRadius > array.length - 1 ||
            i - info.width * blurRadius - blurRadius < 0 ||
            i + info.width * blurRadius > array.length - 1
        ) {
            result.push(array[i]);
            continue;
        }

        // Initialize
        let blurMult = blurRadius * 2 + 1;
        blurMult *= blurMult;
        let multiplicator = 1 / blurMult;
        let average = 0;
        let count = 1;

        // Add center pixel
        average += array[i] * multiplicator;

        for (let j = 1; j <= blurRadius; j++) {
            // above
            average += array[i - info.width * j] * multiplicator;
            // below
            average += array[i + info.width * j] * multiplicator;
            average += array[i + j] * multiplicator;
            average += array[i - j] * multiplicator;

            for (let k = 1; k <= blurRadius; k++) {
                average += array[i - info.width * j - k] * multiplicator;
                average += array[i - info.width * j + k] * multiplicator;
                average += array[i + info.width * j - k] * multiplicator;
                average += array[i + info.width * j + k] * multiplicator;
                count += 4;
            }
            count += 4;
        }
        // if (i === 52250) {
        //     console.log(
        //         ' RUNNING VALUE -> ' +
        //             array[i] +
        //             '\n SUMS -> ' +
        //             count +
        //             '\n MULTIPLICATOR -> ' +
        //             multiplicator +
        //             '\n BLUR RADIUS -> ' +
        //             blurRadius
        //     );
        // }

        result.push(Math.floor(average));
    }

    return result;
}
