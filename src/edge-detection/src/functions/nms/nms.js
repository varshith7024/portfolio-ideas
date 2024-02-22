import { createWorker } from '../../common/worker.js';

async function NonMaximumSupression(magnitude, direction, info) {
    // Split data into Red, Green, Blue
    let track_index = 0;
    let red_array = [];

    for (var i = 0; i < magnitude.length; i++) {
        if (track_index === 0) {
            red_array.push(magnitude[i]);
            track_index += 1;
        } else if (track_index === 1) {
            track_index += 1;
        } else if (track_index === 2) {
            track_index += 1;
        } else {
            // Alpha values here
            track_index = 0;
            continue;
        }
    }

    // Create workers
    let promises = [];

    promises.push(
        createWorker('functions/nms/nms-worker.js', {
            magnitude: red_array,
            direction: direction,
            info: info,
        })
    );

    // Wait for promises and assign values
    const workerData = await Promise.all(promises);
    red_array = workerData[0];

    // Combine red, green and blue values
    let result = [];
    for (var i = 0; i < magnitude.length / 4; i++) {
        result.push(red_array[i]);
        result.push(red_array[i]);
        result.push(red_array[i]);

        // Alpha value
        result.push(255);
    }

    return result;
}

export { NonMaximumSupression };
