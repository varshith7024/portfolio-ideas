function greyscale(array) {
    let result = new Uint8ClampedArray(array.length);

    for (let i = 0; i < array.length; i += 4) {
        let red = array[i];
        let green = array[i + 1];
        let blue = array[i + 2];

        //ITU-R recommendation (BT.709, specifically)
        let grey = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        result[i] = grey;
        result[i + 1] = grey;
        result[i + 2] = grey;
        result[i + 3] = 255;
    }

    return result;
}

export { greyscale };
