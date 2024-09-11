let shdr, shdr2, c;
let vertSource, fragSource, fragSource2, buffer;

function preload() {
    vertSource = loadStrings('./shaders/default.vert');
    fragSource = loadStrings('./shaders/shader.frag');
    fragSource2 = loadStrings('./shaders/shader2.frag');
}

function setup() {
    c = createCanvas(windowWidth, windowHeight, WEBGL);

    // Process and create shaders
    vertSource = resolveLygia(vertSource.join('\n'));
    fragSource = resolveLygia(fragSource.join('\n'));
    fragSource2 = resolveLygia(fragSource2.join('\n'));

    shdr = createShader(vertSource, fragSource);
    shdr2 = createShader(vertSource, fragSource2); // Assuming same vertex shader
}

function draw() {
    shader(shdr);
    shdr.setUniform('u_resolution', [width, height]);
    shdr.setUniform('u_mouse', [mouseX, mouseY]);
    shdr.setUniform('u_time', millis() / 1000.0);
    rect(0, 0, width, height);

    shader(shdr2);
    shdr2.setUniform('u_resolution', [width, height]);
    shdr2.setUniform('u_mouse', [mouseX, mouseY]);
    shdr2.setUniform('u_time', millis() / 1000.0);
    shdr2.setUniform('tex0', c);

    rect(0, 0, width, height);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    resizeCanvas(windowWidth, windowHeight);
}
