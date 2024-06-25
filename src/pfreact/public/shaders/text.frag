precision mediump float;

// texcoords from the vertex shader
varying vec2 vTexCoord;

uniform sampler2D bloom_texture;
uniform sampler2D text_texture;
uniform sampler2D wave_texture;

void main() {
    vec2 uv = vTexCoord;
    uv = 1.0 - uv;
    uv = vec2((1.0 - uv.x), uv.y);

    vec4 bloomCol = texture2D(bloom_texture, uv);
    vec4 textCol = texture2D(text_texture, uv);
    vec4 waveCol = texture2D(wave_texture, uv);

    if(textCol.x != 1.0) {
        if(waveCol.x == 1.0) {
            gl_FragColor = vec4(1.0);
        } else {
            gl_FragColor = vec4(vec3(0.0), 1.0);

        }

    } else {
        gl_FragColor = bloomCol;
    }

}