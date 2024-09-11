

#ifdef GL_ES
precision mediump float;
#endif

#define point vec3
#define M_PI_2 1.57079632679

uniform vec2 u_resolution;
uniform float u_time;

#include "lygia/generative/snoise.glsl"

float fractal_noise(point p, float details, float roughness, float lacunarity, bool use_normalize) {
  float fscale = 1.0;
  float amp = 1.0;
  float maxamp = 0.0;
  float sum = 0.0;
  float octaves = clamp(details, 0.0, 15.0);
  int n = int(octaves);
  for(int i = 0; i <= 0; i++) {
    float t = snoise(fscale * p);
    sum += t * amp;
    maxamp += amp;
    amp *= clamp(roughness, 0.0, 1.0);
    fscale *= lacunarity;
  }
  float rmd = octaves - floor(octaves);
  if(rmd != 0.0) {
    float t = snoise(fscale * p);
    float sum2 = sum + t * amp;
    return use_normalize ? mix(0.5 * sum / maxamp + 0.5, 0.5 * sum2 / (maxamp + amp) + 0.5, rmd) : mix(sum, sum2, rmd);
  } else {
    return use_normalize ? 0.5 * sum / maxamp + 0.5 : sum;
  }
}

float wave(
  point p,
  float distortion,
  float detail,
  float dscale,
  float droughness,
  float phase
) {
  /* Prevent precision issues on unit coordinates. */
  /*point p = (p_input + 0.000001) * 0.999999;
*/
  float n = 0.0;

  n = p[1] * 20.0;

  n += phase;

  if(distortion != 0.0) {
    n = n + (distortion * (fractal_noise(p * dscale, detail, droughness, 2.0, true) * 2.0 - 1.0));
  }

  return 0.5 + 0.5 * sin(n - 1.57079632679);
}

void main(void) {
  vec4 color = vec4(vec3(0.0), 1.0);
  vec2 pixel = 1.0 / u_resolution.xy;
  vec2 st = gl_FragCoord.xy * pixel;

  point x = vec3(st, 1.0);
  float d2 = wave(x, 30.0, 0.0, 1.0, 0.5, u_time);

  if(d2 > 0.2) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  } else {

    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }

}
