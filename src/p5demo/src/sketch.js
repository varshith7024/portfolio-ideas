let shdr;
let vertSource, fragSource;

function preload() {
    vertSource = loadStrings('./shaders/default.vert');
    fragSource = loadStrings('./shaders/shader.frag');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);

    vertSource = resolveLygia(vertSource);
    fragSource = resolveLygia(fragSource);

    shdr = createShader(vertSource, fragSource);
}

function draw() {
    shader(shdr);

    shdr.setUniform('u_resolution', [width, height]);
    shdr.setUniform('u_mouse', [mouseX, mouseY]);
    shdr.setUniform('u_time', millis() / 1000.0);

    rect(0, 0, width, height);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
