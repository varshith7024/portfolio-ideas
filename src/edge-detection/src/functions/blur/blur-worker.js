import init, {
    fast_box_blur_wasm,
} from '../../wasm-functions/pkg/wasm_functions.js';

onmessage = async function (e) {
    let msg = e.data;
    let post = await averageArray(msg.array, msg.info);
    self.postMessage(post);
};
async function averageArray_wasm(array, info) {
    await init();

    let result = fast_box_blur_wasm(array, 3);

    return result;
}

async function averageArray(array, info) {
    await init();

    let result = [];
    let blurSize = info.blurSize;
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
        result.push(Math.floor(average));
    }

    return result;
}
