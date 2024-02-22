function arrayToCanvas(array, ctx, width, height) {
    let canvasData = new Uint8ClampedArray(array);
    let canvasImage = new ImageData(canvasData, width, height);

    ctx.putImageData(canvasImage, 0, 0);
}

export { arrayToCanvas };
