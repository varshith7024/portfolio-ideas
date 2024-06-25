precision mediump float;

// texcoords from the vertex shader
varying vec2 vTexCoord;

uniform sampler2D wave_texture;
uniform sampler2D blur_texture;
uniform bool check;

uniform float mouseX;

void main() {
    vec2 uv = vTexCoord;
    uv = 1.0 - uv;

    vec4 waveCol = texture2D(wave_texture, uv);
    vec4 blurCol = texture2D(blur_texture, uv);

    float avg = dot(blurCol.rgb, vec3(0.3333333));

    waveCol += blurCol;
    vec3 result = vec3(1.0) - exp(-waveCol.xyz * 1.0);
    result = pow(result, vec3(1.0 / 2.2));
    gl_FragColor = vec4(result, 1.0);
}