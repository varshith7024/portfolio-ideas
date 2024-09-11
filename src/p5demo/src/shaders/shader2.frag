#ifdef GL_ES
precision mediump float;
#endif

#define point vec3
#define M_PI_2 1.57079632679

#define FXAA_SPAN_MAX 8.0
#define FXAA_REDUCE_MUL   (1.0/FXAA_SPAN_MAX)
#define FXAA_REDUCE_MIN   (1.0/128.0)
#define FXAA_SUBPIX_SHIFT (1.0/4.0)

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D tex0;
varying vec2 v_texcoord;

vec3 FxaaPixelShader(vec4 uv, sampler2D tex, vec2 rcpFrame) {

  vec3 rgbNW = texture2D(tex, uv.zw, 0.0).xyz;
  vec3 rgbNE = texture2D(tex, uv.zw + vec2(1, 0) * rcpFrame.xy, 0.0).xyz;
  vec3 rgbSW = texture2D(tex, uv.zw + vec2(0, 1) * rcpFrame.xy, 0.0).xyz;
  vec3 rgbSE = texture2D(tex, uv.zw + vec2(1, 1) * rcpFrame.xy, 0.0).xyz;
  vec3 rgbM = texture2D(tex, uv.xy, 0.0).xyz;

  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lumaNW = dot(rgbNW, luma);
  float lumaNE = dot(rgbNE, luma);
  float lumaSW = dot(rgbSW, luma);
  float lumaSE = dot(rgbSE, luma);
  float lumaM = dot(rgbM, luma);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

  dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * rcpFrame.xy;

  vec3 rgbA = (1.0 / 2.0) * (texture2D(tex, uv.xy + dir * (1.0 / 3.0 - 0.5), 0.0).xyz +
    texture2D(tex, uv.xy + dir * (2.0 / 3.0 - 0.5), 0.0).xyz);
  vec3 rgbB = rgbA * (1.0 / 2.0) + (1.0 / 4.0) * (texture2D(tex, uv.xy + dir * (0.0 / 3.0 - 0.5), 0.0).xyz +
    texture2D(tex, uv.xy + dir * (3.0 / 3.0 - 0.5), 0.0).xyz);

  float lumaB = dot(rgbB, luma);

  if((lumaB < lumaMin) || (lumaB > lumaMax))
    return rgbA;

  return rgbB;
}

void main(void) {
  vec2 rcpFrame = 1.0 / u_resolution.xy;
  vec4 color = texture2D(tex0, v_texcoord);
  vec2 uv2 = gl_FragCoord.xy / u_resolution.xy;

  vec4 uv = vec4(uv2, uv2 - (rcpFrame * (0.5 + FXAA_SUBPIX_SHIFT)));

  if(v_texcoord.x < 0.49) {
    gl_FragColor = vec4(FxaaPixelShader(uv, tex0, rcpFrame), 1.0);
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else if(v_texcoord.x > 0.51) {
    gl_FragColor = color;
  } else {
    gl_FragColor = vec4(vec3(0.0), 1.0);
  }
  gl_FragColor = color;

}