precision mediump float;

// texcoords from the vertex shader

// our texture coming from p5
uniform sampler2D tex0;

void main() {

  vec2 uv = gl_FragCoord.xy;

  // use our blur function
   // vec3 blur = gaussianBlur(tex0, uv, texelSize * direction);
  vec3 col = texture2D(tex0, uv).xyz;

  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}