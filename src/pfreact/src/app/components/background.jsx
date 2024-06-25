'use client';

import { NextReactP5Wrapper } from '@p5-wrapper/next';
import resolveLygia from '../lib/lydia.resolve.esm';
import { useRef, useEffect } from 'react';
import styles from './background.module.css';

export default function CustomBackground() {
    let start = 0;
    let check = true;
    let count = [];

    function handleClick() {
        check = check ? false : true;
        console.log(count);
    }

    const backgroundSketch = (p5) => {
        let waves, blurVertical, blurHorizontal, bloom, textInvert;
        let wavesPass,
            blurVerticalPass,
            blurHorizontalPass,
            bloomPass,
            textInvertPass;

        let img;

        function prepareTextTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // alpha: false for subpixel anti-aliasing
            const ctx = canvas.getContext('2d', { alpha: false });

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#000000';
            ctx.font = '12vw "Amore Lite Edition"';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            ctx.fillText(
                'VARSHITH ANTHAGIRI',
                canvas.width / 2,
                canvas.height / 2
            );

            let data = ctx.getImageData(0, 0, canvas.width, canvas.height);

            console.log(data.data);
            const base64Canvas = canvas.toDataURL();

            img = p5.loadImage(base64Canvas);
        }

        p5.preload = () => {
            prepareTextTexture();

            waves = p5.loadShader('./shaders/base.vert', './shaders/wave.frag');

            blurVertical = p5.loadShader(
                './shaders/base.vert',
                './shaders/blur.frag'
            );
            blurHorizontal = p5.loadShader(
                './shaders/base.vert',
                './shaders/blur.frag'
            );

            bloom = p5.loadShader(
                './shaders/base.vert',
                './shaders/bloom.frag'
            );

            textInvert = p5.loadShader(
                './shaders/base.vert',
                './shaders/text.frag'
            );
        };

        p5.setup = () => {
            p5.createCanvas(p5.windowWidth, p5.windowHeight);
            p5.noStroke();

            wavesPass = p5.createGraphics(
                p5.windowWidth,
                p5.windowHeight,
                p5.WEBGL
            );
            blurHorizontalPass = p5.createGraphics(
                p5.windowWidth,
                p5.windowHeight,
                p5.WEBGL
            );
            blurVerticalPass = p5.createGraphics(
                p5.windowWidth,
                p5.windowHeight,
                p5.WEBGL
            );
            bloomPass = p5.createGraphics(
                p5.windowWidth,
                p5.windowHeight,
                p5.WEBGL
            );
            textInvertPass = p5.createGraphics(
                p5.windowWidth,
                p5.windowHeight,
                p5.WEBGL
            );
        };

        p5.draw = () => {
            start = performance.now();

            // #region waves
            wavesPass.shader(waves);
            waves.setUniform('u_resolution', [p5.width, p5.height]);
            waves.setUniform('u_time', p5.millis() / 1000.0);
            wavesPass.rect(0, 0, p5.width, p5.height);
            // #endregion
            count = [];
            // #region blur-horizontal
            blurHorizontalPass.shader(blurHorizontal);
            blurHorizontal.setUniform('tex0', wavesPass);
            blurHorizontal.setUniform('texelSize', [
                1.0 / p5.width,
                1.0 / p5.height,
            ]);
            blurHorizontal.setUniform('direction', [1.0, 0.0]);
            blurHorizontalPass.rect(0, 0, p5.width, p5.height);
            // #endregion

            // #region blur-vertical
            blurVerticalPass.shader(blurVertical);
            blurVertical.setUniform('tex0', blurHorizontalPass);
            blurVertical.setUniform('texelSize', [
                1.0 / p5.width,
                1.0 / p5.height,
            ]);
            blurVertical.setUniform('direction', [0.0, 1.0]);
            blurVerticalPass.rect(0, 0, p5.width, p5.height);
            // #endregion

            // #region bloom
            bloomPass.shader(bloom);
            bloom.setUniform('wave_texture', wavesPass);
            bloom.setUniform('blur_texture', blurVerticalPass);
            bloom.setUniform('mouseX', p5.mouseX / p5.width);
            bloom.setUniform('check', check);
            bloomPass.rect(0, 0, p5.width, p5.height);
            // #endregion

            textInvertPass.shader(textInvert);
            textInvert.setUniform('wave_texture', wavesPass);
            textInvert.setUniform('text_texture', img);
            textInvert.setUniform('bloom_texture', bloomPass);
            textInvertPass.rect(0, 0, p5.width, p5.height);

            p5.image(textInvertPass, 0, 0);
            let end = performance.now();
            count = end - start;
        };

        p5.windowResized = () => {
            prepareTextTexture();
            p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        };
    };

    return (
        <div className={styles.customBackground}>
            <NextReactP5Wrapper sketch={backgroundSketch}></NextReactP5Wrapper>
            <button onClick={handleClick} className={styles.check}>
                flip
            </button>
        </div>
    );
}

// p5.shader(waves);

//             waves.setUniform('u_resolution', [p5.width, p5.height]);
//             waves.setUniform('u_time', p5.millis() / 1000.0);

//             p5.rect(0, 0, p5.width, p5.height);

//             p5.shader(blurH);

//             blurV.setUniform('tex0', waves);
//             blurV.setUniform('texelSize', [1.0 / p5.width, 1.0 / p5.height]);
//             blurV.setUniform('direction', [1.0, 0.0]);

//             p5.rect(0, 0, p5.width, p5.height);

//             p5.shader(blurV);

//             blurV.setUniform('tex0', blurH);
//             blurV.setUniform('texelSize', [1.0 / p5.width, 1.0 / p5.height]);
//             blurV.setUniform('direction', [0.0, 1.0]);

//             p5.rect(0, 0, p5.width, p5.height);

//             p5.image(0, 0, p5.width, p5.height);
