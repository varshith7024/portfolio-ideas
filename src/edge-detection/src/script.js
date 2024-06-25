import { sobelConvolutionFilter } from './functions/sobel/sobel.js';
import { fastBoxBlur } from './functions/blur/blur.js';
import { doubleThreshold } from './functions/dthreshold/dthreshold.js';
import { greyscale } from './functions/greyscale/greyscale.js';
import { NonMaximumSupression } from './functions/nms/nms.js';
import { HysteresisEdgeTracking } from './functions/hysteresis/hysteresis.js';
import { arrayToCanvas } from './common/canvas.js';

// import init, {
//     fast_box_blur_wasm,
//     greyscale_wasm,
// } from './wasm-functions/pkg/wasm_functions.js';

///// CONSTANTS
const imageName = 'tes4.jpg';
const dtMin = 0.09;
const dtMax = 0.12;
const blurRadius = 10;

async function edgeDetect() {
    // await init();

    let start = performance.now();
    let totalStart = performance.now();
    // Establish Canvas
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    let copyCanvas = document.getElementById('copyCanvas');
    let copyCtx = copyCanvas.getContext('2d');

    const img = new Image();
    img.src = imageName;
    await img.decode();

    const height = img.height;
    const width = img.width;

    canvas.height = height;
    canvas.width = width;

    copyCanvas.height = height;
    copyCanvas.width = width;

    let info = {
        height: height,
        width: width,
        blurSize: blurRadius,
    };

    ctx.drawImage(img, 0, 0);
    copyCtx.drawImage(img, 0, 0);

    // Get Image Data
    let data = ctx.getImageData(0, 0, width, height);
    let imageData = data.data;
    let imageFirstDraw = performance.now();
    console.log(
        `Image First Draw completed in: ${Math.floor(imageFirstDraw - start)}ms`
    );
    start = performance.now();

    let greyscaleImage = greyscale(imageData);
    // wasm overhead is too much
    //let greyscaleImage = greyscale_wasm(imageData);
    let greyscaleExecutionTime = performance.now();
    console.log(
        `Greyscale Conversion completed in: ${Math.floor(
            greyscaleExecutionTime - start
        )}ms`
    );
    start = performance.now();

    arrayToCanvas(greyscaleImage, ctx, width, height);

    // Approximate Gaussian Blur
    let newData = await fastBoxBlur(greyscaleImage, info);
    newData = await fastBoxBlur(newData, info);
    let smoothingExecutionTime = performance.now();
    console.log(
        `Box Blur completed in: ${Math.floor(smoothingExecutionTime - start)}ms`
    );
    start = performance.now();

    arrayToCanvas(newData, ctx, width, height);

    let sobelData = await sobelConvolutionFilter(newData, info);
    let sobelDataMagnitude = sobelData.magnitude;
    let sobelDataEdgeDirections = sobelData.edgeDirections;
    let sobelConvolutionTime = performance.now();
    console.log(
        `Sobel Convolution completed in: ${Math.floor(
            sobelConvolutionTime - start
        )}ms`
    );
    start = performance.now();

    arrayToCanvas(sobelDataMagnitude, ctx, width, height);

    let nmsData = await NonMaximumSupression(
        sobelDataMagnitude,
        sobelDataEdgeDirections,
        info
    );
    let nmsExecutionTime = performance.now();
    console.log(
        `Non Maximum Supression completed in: ${Math.floor(
            nmsExecutionTime - start
        )}ms`
    );
    arrayToCanvas(nmsData, ctx, width, height);

    start = performance.now();

    let dtData = await doubleThreshold(nmsData, dtMin, dtMax);
    let dtExecutionTime = performance.now();
    console.log(
        `Double Threshold completed in: ${Math.floor(
            dtExecutionTime - start
        )}ms`
    );

    arrayToCanvas(dtData, ctx, width, height);

    start = performance.now();

    let hysteresisData = await HysteresisEdgeTracking(dtData, info);
    let hysteresisExecutionTime = performance.now();
    console.log(
        `Hysteresis Edge Tracking completed in ${Math.floor(
            hysteresisExecutionTime - start
        )}ms`
    );

    arrayToCanvas(hysteresisData, ctx, width, height);

    let totalEnd = performance.now();
    console.log(
        `Total execution time: ${Math.floor(
            totalEnd - totalStart
        )}ms \n Image Size: ${img.width}x${img.height}`
    );
}

async function main() {
    await edgeDetect();
}

main();

/*
    1. Grayscale - DONE
    2. Gaussian Filter to Reduce Noise - DONE
    3. Find Intensity Gradients - Sobel Kernel - DONE
    4. Non-Max Supression - check for local maximum - DONE
    5. Double Threshold - DONE
    6. Hysterisis Edge Tracking - DONE
*/
