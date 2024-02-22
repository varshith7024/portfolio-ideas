import { sobelConvolutionFilter } from './functions/sobel/sobel.js';
import { fastBoxBlur } from './functions/blur/blur.js';
import { doubleThreshold } from './functions/dthreshold/dthreshold.js';
import { greyscale } from './functions/greyscale/greyscale.js';
import { NonMaximumSupression } from './functions/nms/nms.js';
import { HysteresisEdgeTracking } from './functions/hysteresis/hysteresis.js';

async function main() {
    let start = performance.now();
    let totalStart = performance.now();
    // Establish Canvas
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    let copyCanvas = document.getElementById('copyCanvas');
    let copyCtx = copyCanvas.getContext('2d');

    const img = new Image();
    img.src = 'tes3.jpg';
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
    let greyscaleExecutionTime = performance.now();
    console.log(
        `Greyscale Conversion completed in: ${Math.floor(
            greyscaleExecutionTime - start
        )}ms`
    );
    start = performance.now();

    let greyscaleCanvasData = new ImageData(greyscaleImage, width, height);
    ctx.putImageData(greyscaleCanvasData, 0, 0);

    // Approximate Gaussian Blur
    let newData = await fastBoxBlur(greyscaleImage, info);
    newData = await fastBoxBlur(newData, info);
    let smoothingExecutionTime = performance.now();
    console.log(
        `Box Blur completed in: ${Math.floor(smoothingExecutionTime - start)}ms`
    );
    start = performance.now();

    let newDataClamped = new Uint8ClampedArray(newData);
    let newDataCanvas = new ImageData(newDataClamped, width, height);
    ctx.putImageData(newDataCanvas, 0, 0);

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

    let sobelDataClamped = new Uint8ClampedArray(sobelDataMagnitude);
    let sobelDataCanvas = new ImageData(sobelDataClamped, width, height);
    ctx.putImageData(sobelDataCanvas, 0, 0);

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
    let nmsClamped = new Uint8ClampedArray(nmsData);
    let nmsCanvas = new ImageData(nmsClamped, width, height);
    ctx.putImageData(nmsCanvas, 0, 0);

    start = performance.now();

    let dtData = await doubleThreshold(nmsData, 0.09, 0.12);
    let dtExecutionTime = performance.now();
    console.log(
        `Double Threshold completed in: ${Math.floor(
            dtExecutionTime - start
        )}ms`
    );
    let dtClamped = new Uint8ClampedArray(dtData);
    let dtCanvas = new ImageData(dtClamped, width, height);
    ctx.putImageData(dtCanvas, 0, 0);
    start = performance.now();

    let hysteresisData = await HysteresisEdgeTracking(dtData, info);
    let hysteresisExecutionTime = performance.now();
    console.log(
        `Hysteresis Edge Tracking completed in ${Math.floor(
            hysteresisExecutionTime - start
        )}ms`
    );

    let final = new ImageData(width, height);
    for (let i = 0; i < final.data.length; i++) {
        final.data[i] = hysteresisData[i];
    }

    ctx.putImageData(final, 0, 0);
    let totalEnd = performance.now();
    console.log(
        `Total execution time: ${Math.floor(
            totalEnd - totalStart
        )}ms \n Image Size: ${img.width}x${img.height}`
    );
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
