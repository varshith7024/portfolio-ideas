let externalCode = `
//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket, Johan Helsing
//
fn mod289(x : vec2f) - > vec2f {
return x - floor(x * (1. / 289.)) * 289.;
}

fn mod289_3(x : vec3f) - > vec3f {
return x - floor(x * (1. / 289.)) * 289.;
}

fn permute3(x : vec3f) - > vec3f {
return mod289_3(((x * 34.) + 1.) * x);
}

fn highlights(x : vec4f) - > vec4f {
var y = vec4(0.0, 0.0, 0.0, 1.0);
let strength = 0.5;
if(x[0] > strength) {
y[0] = 1.0;
}
return y;
}

//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket
fn simplexNoise2(v : vec2f) - > f32 {
let C = vec4(0.211324865405187, // (3.0-sqrt(3.0))/6.0
0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
- 0.577350269189626, // -1.0 + 2.0 * C.x
0.024390243902439 // 1.0 / 41.0
);

    // First corner
var i = floor(v + dot(v, C.yy));
let x0 = v - i + dot(i, C.xx);

    // Other corners
var i1 = select(vec2(0., 1.), vec2(1., 0.), x0.x > x0.y);

    // x0 = x0 - 0.0 + 0.0 * C.xx ;
    // x1 = x0 - i1 + 1.0 * C.xx ;
    // x2 = x0 - 1.0 + 2.0 * C.xx ;
var x12 = x0.xyxy + C.xxzz;
x12.x = x12.x - i1.x;
x12.y = x12.y - i1.y;

    // Permutations
i = mod289(i); // Avoid truncation effects in permutation

var p = permute3(permute3(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
var m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3(0.));
m *= m;
m *= m;

    // Gradients: 41 points uniformly over a line, mapped onto a diamond.
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
let x = 2. * fract(p * C.www) - 1.;
let h = abs(x) - 0.5;
let ox = floor(x + 0.5);
let a0 = x - ox;

    // Normalize gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );
m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // Compute final noise value at P
let g = vec3(a0.x * x0.x + h.x * x0.y, a0.yz * x12.xz + h.yz * x12.yw);
return 130. * dot(m, g);
}

group(0) binding(0) var mySampler : sampler;
group(0) binding(1) var myTexture : texture_external;
group(0) binding(2) var mySampler2 : sampler;
group(0) binding(3) var myTexture2 : texture_2d < f32 >;

fragment fn main(location(0) fragUV : vec2 < f32 >) - > location(0) vec4 < f32 > {
let layer = textureSampleBaseClampToEdge(myTexture2, mySampler2, fragUV);
let source = textureSampleBaseClampToEdge(myTexture, mySampler, fragUV);

let noise = simplexNoise2(fragUV / 0.0001) * 0.5 + 0.5;

if(layer[3] == 1.0) {
        //return vec4(source[0] * noise + source[0]  * 0.5 + 0.05, source[1] * noise  + source[1]  * 0.5 + 0.05,  source[2] * noise  + source[2] * 0.5 + 0.05, 1.0);
return highlights(source);
} else {
return vec4(source.xyz, 0.0);
}

};