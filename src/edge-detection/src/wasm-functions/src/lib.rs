use std::time::Instant;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

}

#[wasm_bindgen]
pub fn greyscale_wasm(array: &[u8]) -> Vec<u8> {
    let mut result: Vec<u8> = Vec::new();
    for item in array.chunks(4) {
        let red = item[0] as f32;
        let blue = item[1] as f32;
        let green = item[2] as f32;

        let grey = red * 0.2126 + green * 0.7152 + blue * 0.0722;

        result.push(grey.round() as u8);
        result.push(grey.round() as u8);
        result.push(grey.round() as u8);
        result.push(255 as u8);
    }
    return result.to_vec();
}

#[wasm_bindgen]
pub fn fast_box_blur_wasm(buf: &[u8], blur_radius: usize) -> Vec<u8> {
    // let start = Instant::now();
    /* Check blur radius - has to be odd as the pixel has to be the EXACT center of the square(1)
       See Box Blur(1)
    */
    if blur_radius % 2 == 0 {
        panic!("Blur Radius Was Not An Odd Number");
    }
    struct Info {
        width: usize,
        height: usize,
    }

    let info = Info {
        width: 2400,
        height: 3600,
    };

    let mut result = Vec::new();
    let mut avg_array = Vec::new();
    for (i, _) in buf.iter().enumerate() {
        /* Checks - To make sure I don't try to access a non-existent index in the Vector */
        if i as isize - (blur_radius as isize) < 0
            || i + blur_radius > buf.len() - 1
            || (i as isize - info.width as isize - blur_radius as isize) < 0
            || (i as isize - info.width as isize) < 0
            || (i as isize - info.width as isize + blur_radius as isize) < 0
            || i + info.width as usize + (blur_radius) > buf.len() - 1
            || i + info.width as usize > buf.len() - 1
            || i + info.width as usize + (blur_radius) > buf.len() - 1
            || i as isize - (info.width as isize * blur_radius as isize) - (blur_radius as isize)
                < 0
            || i + (info.width as usize * blur_radius) + blur_radius > buf.len() - 1
        {
            result.push(buf[i]);
            continue;
        }

        /* Push Center Pixel First */
        avg_array.push(buf[i]);

        /* Basically I am pushing each row of pixels and going on to the next row */
        /* Starting from 1 so I don't push the center pixel again and again */
        for j in 1..blur_radius {
            avg_array.push(buf[i - (info.width as usize * j)]);
            avg_array.push(buf[i + (info.width as usize * j)]);
            for k in 1..blur_radius {
                avg_array.push(buf[i - (info.width as usize * j) - k]);
                avg_array.push(buf[i + (info.width as usize * j) - k]);
                avg_array.push(buf[i + (info.width as usize * j) + k]);
                avg_array.push(buf[i - (info.width as usize * j) + k]);
            }
        }

        result.push(average_integer(avg_array));
        avg_array = Vec::new();
    }

    // let dur = start.elapsed();
    // log("DURATION");
    // log(dur.as_millis().to_string().as_str());

    result
}

#[wasm_bindgen]
pub fn average_integer(array: Vec<u8>) -> u8 {
    let mut avg: usize = 0;
    let len = array.len();
    for i in array.iter() {
        avg += *i as usize;
    }
    (avg / len) as u8
}
