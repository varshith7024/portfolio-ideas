import { createWorker } from '../../common/worker.js';

async function sobelConvolutionFilter(data, info) {
    // Split data into Red, Green, Blue
    let track_index = 0;
    let red_array = [];
    let green_array = [];
    let blue_array = [];
    for (var i = 0; i < data.length; i++) {
        if (track_index === 0) {
            red_array.push(data[i]);
            track_index += 1;
        } else if (track_index === 1) {
            green_array.push(data[i]);
            track_index += 1;
        } else if (track_index === 2) {
            blue_array.push(data[i]);
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
        createWorker('functions/sobel/sobel-worker.js', {
            array: red_array,
            info: info,
        })
    );

    // Wait for promises and assign values
    const workerData = await Promise.all(promises);
    red_array = workerData[0].magnitude;
    let red_array_direction = workerData[0].edgeDirections;

    // Combine red, green and blue values
    let result = [];
    for (var i = 0; i < data.length / 4; i++) {
        result.push(red_array[i]);
        result.push(red_array[i]);
        result.push(red_array[i]);
        // Alpha value
        result.push(255);
    }

    let edgeDirections = [];
    for (var i = 0; i < data.length / 4; i++) {
        edgeDirections.push(red_array_direction[i]);
    }

    return {
        magnitude: result,
        edgeDirections: edgeDirections,
    };
}

export { sobelConvolutionFilter };
