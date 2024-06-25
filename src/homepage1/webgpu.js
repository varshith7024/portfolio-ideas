import { WebGPUTextureLoader } from './lib/web-texture-tool.js';

export default async function main() {
    let fullQuad = `
@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;
@group(0) @binding(2) var mySampler2: sampler;
@group(0) @binding(3) var myTexture2: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
}


@vertex
fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  const pos = array(
    vec2( 1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0, -1.0),
    vec2( 1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2(-1.0,  1.0),
  );

  const uv = array(
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
  );

  var output : VertexOutput;
  output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = uv[VertexIndex];
  return output;
}

@fragment
fn frag_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(myTexture, mySampler, fragUV);
}
`;

    let externalCode = `
fn highlights(x: vec4f, strength: f32) -> vec4f {
    var y = vec4(0.0, 0.0, 0.0, 1.0);
    let luminance = (0.2126*x[0] + 0.7152*x[1] + 0.0722*x[2]);

    if (luminance > strength) {
        y = vec4(0.0, 1.0, 0.0, 1.0);
    }
    return y;
}


@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_external;
@group(0) @binding(2) var mySampler2: sampler;
@group(0) @binding(3) var myTexture2: texture_2d<f32>;
@group(0) @binding(4) var<storage, read_write> time: array<f32>;


fn getRGBA(tex: texture_external, splr: sampler, coords: vec2<f32>) -> vec4f {
    // easier to write
    return textureSampleBaseClampToEdge(tex, splr, coords);
}


fn average(tex: texture_external, splr: sampler, coords: vec2<f32>, part: u32, radius_f: f32) -> f32 {
    let texDimensions = textureDimensions(myTexture);
    var onePixel = vec2(1.0, 1.0) / vec2(1920.0, 1080.0);

    var sum = 0.0;
    var radius = radius_f; 
    var fraction = 1 / ((2 * radius + 1) * (2 * radius + 1));
    for (var i = 1.0; i < radius + 1.0; i=i+1.0) {
        // right and left
        sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * i), coords.y))[part] * fraction;
        sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * i), coords.y))[part] * fraction;

        // up and down
        sum += getRGBA(tex, splr, vec2(coords.x , coords.y + (onePixel.y * i)))[part] * fraction;
        sum += getRGBA(tex, splr, vec2(coords.x , coords.y - (onePixel.y * i)))[part] * fraction;

        for (var j = 1.0; j < radius + 1; j=j+1.0) {
            sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * i), coords.y + (onePixel.y * j)))[part] * fraction;
            sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * i), coords.y + (onePixel.y * j)))[part] * fraction;

            sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * i), coords.y - (onePixel.y * j)))[part] * fraction;
            sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * i), coords.y - (onePixel.y * j)))[part] * fraction;
        }
    }
    return sum;
}

fn sobelHorizontal(tex: texture_external, splr: sampler, coords: vec2<f32>, part: u32, radius_f: f32) -> f32 {
    let texDimensions = textureDimensions(myTexture);
    var onePixel = vec2(1.0, 1.0) / vec2(1920.0, 1080.0);

    var sum = 0.0;
    var radius = radius_f; 
    var fraction = 1 / ((2 * radius + 1) * (2 * radius + 1));

    // left right
    sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * 1), coords.y))[part] * 0.0;
    sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * 1), coords.y))[part] * 0.0;

    // up and down
    sum += getRGBA(tex, splr, vec2(coords.x , coords.y + (onePixel.y * 1)))[part] * -2.0;
    sum += getRGBA(tex, splr, vec2(coords.x , coords.y - (onePixel.y * 1)))[part] * 2.0;

    sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * 1), coords.y + (onePixel.y * 1)))[part] * -1.0;
    sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * 1), coords.y + (onePixel.y * 1)))[part] * -1.0;

    sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * 1), coords.y - (onePixel.y * 1)))[part] * 1.0;
    sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * 1), coords.y - (onePixel.y * 1)))[part] * 1.0;
    return sum;
}
fn sobelVertical(tex: texture_external, splr: sampler, coords: vec2<f32>, part: u32, radius_f: f32) -> f32 {
    let texDimensions = textureDimensions(myTexture);
    var onePixel = vec2(1.0, 1.0) / vec2(1920.0, 1080.0);

    var sum = 0.0;
    var radius = radius_f; 
    var fraction = 1 / ((2 * radius + 1) * (2 * radius + 1));

    // left right
    sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * 1), coords.y))[part] * 2.0;
    sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * 1), coords.y))[part] * -2.0;

    // up and down
    sum += getRGBA(tex, splr, vec2(coords.x , coords.y + (onePixel.y * 1)))[part] * 0.0;
    sum += getRGBA(tex, splr, vec2(coords.x , coords.y - (onePixel.y * 1)))[part] * 0.0;

    sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * 1), coords.y + (onePixel.y * 1)))[part] * -1.0;
    sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * 1), coords.y + (onePixel.y * 1)))[part] * 1.0;

    sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * 1), coords.y - (onePixel.y * 1)))[part] * -1.0;
    sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * 1), coords.y - (onePixel.y * 1)))[part] * 1.0;
    return sum;
}


fn sobel(tex: texture_external, splr: sampler, coords: vec2<f32>, part: u32, radius_f: f32) -> f32 {
    let vert = sobelVertical(tex, splr, coords, part, radius_f);
    let horizontal = sobelHorizontal(tex, splr, coords, part, radius_f);
    let result = sqrt((vert*vert) + (horizontal*horizontal));
    return result;
}



@fragment
fn main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
    let layer = textureSampleBaseClampToEdge(myTexture2, mySampler2, fragUV);
    let source = textureSampleBaseClampToEdge(myTexture, mySampler, fragUV);

    let threshold = 0.3;
    let radius = 3.0;

    var iTime = time[0];

    
    if (layer[3] != 0.0) {
        
        return highlights(getRGBA(myTexture, mySampler, fragUV), 0.5);

        //return vhsEffect(fragUV, iTime);
    } 
    if (layer[3] > 0.5) {
        
        //return vec4(avg_red, avg_green, avg_blue, (time[0] / 300) * (layer[3] + 0.5));

        return highlights(getRGBA(myTexture, mySampler, fragUV), 0.5);

    } 
    else {
        let radius = 5.0;

         var avg_red =  sobel(myTexture, mySampler, fragUV, 0, radius);
         var avg_green =  sobel(myTexture, mySampler, fragUV, 1, radius);
         var avg_blue = sobel(myTexture, mySampler, fragUV, 2, radius);


        
        return vec4(avg_red, avg_green, avg_blue, 1.0);
        
     }
 

}
`;
    let externalCodeVHSEffect = `
fn highlights(x: vec4f, strength: f32) -> vec4f {
    var y = vec4(0.0, 0.0, 0.0, 1.0);
    let luminance = (0.2126*x[0] + 0.7152*x[1] + 0.0722*x[2]);

    if (luminance > strength) {
        y = vec4(0.0, 1.0, 0.0, 1.0);
    }
    return y;
}

const range: f32 = 0.05;
const noiseQuality: f32 = 250.0;
const noiseIntensity: f32 = 0.0088;
const offsetIntensity: f32 = 0.02;
const colorOffsetIntensity: f32 = 1.3;

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_external;
@group(0) @binding(2) var mySampler2: sampler;
@group(0) @binding(3) var myTexture2: texture_2d<f32>;
@group(0) @binding(4) var<storage, read_write> time: array<f32>;


fn getRGBA(tex: texture_external, splr: sampler, coords: vec2<f32>) -> vec4f {
    // easier to write
    return textureSampleBaseClampToEdge(tex, splr, coords);
}

fn rand(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.545);
}

fn verticalBar(pos: f32, uvY: f32, offset: f32) -> f32 {
    var edge0 = pos - range;
    var edge1 = pos + range;

    var x: f32 = smoothstep(edge0, pos, uvY) * offset;
    x -= smoothstep(pos, edge1, uvY) * offset;
    return x;
}

fn average(tex: texture_external, splr: sampler, coords: vec2<f32>, part: u32, radius_f: f32) -> f32 {
    let texDimensions = textureDimensions(myTexture);
    var onePixel = vec2(1.0, 1.0) / vec2(1920.0, 1080.0);

    var sum = 0.0;
    var radius = radius_f; 
    var fraction = 1 / ((2 * radius + 1) * (2 * radius + 1));
    for (var i = 1.0; i < radius + 1.0; i=i+1.0) {
        // right and left
        sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * i), coords.y))[part] * fraction;
        sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * i), coords.y))[part] * fraction;

        // up and down
        sum += getRGBA(tex, splr, vec2(coords.x , coords.y + (onePixel.y * i)))[part] * fraction;
        sum += getRGBA(tex, splr, vec2(coords.x , coords.y - (onePixel.y * i)))[part] * fraction;

        for (var j = 1.0; j < radius + 1; j=j+1.0) {
            sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * i), coords.y + (onePixel.y * j)))[part] * fraction;
            sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * i), coords.y + (onePixel.y * j)))[part] * fraction;

            sum += getRGBA(tex, splr, vec2(coords.x + (onePixel.x * i), coords.y - (onePixel.y * j)))[part] * fraction;
            sum += getRGBA(tex, splr, vec2(coords.x - (onePixel.x * i), coords.y - (onePixel.y * j)))[part] * fraction;
        }
    }
    return sum;
}

fn vhsEffect(fragUV : vec2<f32>, iTime: f32) -> vec4<f32> {
    var uv = fragUV;

        for (var i: f32 = 0.0; i < 0.71; i+= 0.1313) {
            var d: f32 = (iTime * i) % 1.7;
            var o: f32 = sin(1.0 - tan(iTime * 0.24 * i));
            o *= offsetIntensity;
            uv.x += verticalBar(d, uv.y, o);
        } 

        var uvY: f32 = uv.y;
        uvY *= noiseQuality;
        uvY = uvY * (1.0 / noiseQuality);
        var noise: f32 = rand(vec2(iTime * 0.00001, uvY));
        uv.x += noise * noiseIntensity;

        var offsetR: vec2<f32> = vec2(0.006 * sin(iTime), 0.0) * colorOffsetIntensity;
        var offsetG: vec2<f32> = vec2(0.0073 * (cos(iTime * 0.97)), 0.0) * colorOffsetIntensity;

        var color = vec3(
                 getRGBA(myTexture, mySampler, uv + offsetR)[0],
                 getRGBA(myTexture, mySampler, uv + offsetG)[1],
             getRGBA(myTexture, mySampler, uv)[2],
             );

        var result = vec4(color, 1.0);
        return result;
}

@fragment
fn main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
    let layer = textureSampleBaseClampToEdge(myTexture2, mySampler2, fragUV);
    let source = textureSampleBaseClampToEdge(myTexture, mySampler, fragUV);

    let threshold = 0.3;
    let radius = 3.0;

    var iTime = time[0];

    
    if (layer[3] != 0.0) {
        
        return vec4(0.0, 0.0, 0.0, 1.0);
        //return vhsEffect(fragUV, iTime);
    } 
    if (layer[3] > 0.5) {
        
        //return vec4(avg_red, avg_green, avg_blue, (time[0] / 300) * (layer[3] + 0.5));

        return getRGBA(myTexture, mySampler, fragUV);

    } 
    else {
        // let radius = 3.0;

        //  let avg_red = 1.0 - average(myTexture, mySampler, fragUV, 0, radius);
        //  let avg_green = 1.0 - average(myTexture, mySampler, fragUV, 1, radius);
        //  let avg_blue = 1.0 - average(myTexture, mySampler, fragUV, 2, radius);
        
        //return highlights(vec4(getRGBA(myTexture, mySampler, fragUV).xyz, (time[0] / 300) * layer[3]), threshold);
///////////////////////////////////////////////////////
        // var color = vec3(
        //     getRGBA(myTexture, mySampler, fragUV - vec2(0.01, 0.0))[0],
        //     getRGBA(myTexture, mySampler, fragUV + vec2(0.01, 0.0))[1],
        //     getRGBA(myTexture, mySampler, fragUV)[2],
        // );
    
        // color.r = cos(color.r) * cos(color.r);
        // color.b = cos(color.b + color.g) * cos(color.b);
        // color.g = color.r * color.b;
    
        // var color2 = color;
        // color2.g = 0.0;
    
        // var maxrb = max(color.r, color.b);
        // var k = clamp( (color.g - maxrb)*5.0, 0.0, 1.0);
        // var dg = color.g;
        // color.g  = min(color.g, maxrb*0.8);
        // color += dg - color.g;
    
    
        // return vec4(mix(color, color2, k), 1.0);
///////////////////////////////////////////////////////////
        return highlights(vhsEffect(fragUV, iTime), threshold);
        
     }
 

}
`;

    // Set video element
    const video = document.createElement('video');
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.src = new URL('./assets/vid.mp4', import.meta.url).toString();
    try {
        await video.play();
    } catch {
        //window.location.reload(false);
    }

    let adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const loader = new WebGPUTextureLoader(device);

    let canvas = document.getElementById('gpucanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext('webgpu');

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    // time
    let timeArray = new Float32Array([1.0]);

    const timeBuffer = device.createBuffer({
        size: timeArray.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                sampler: {},
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                externalTexture: {},
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                sampler: {},
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                texture: {},
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: 'storage',
                },
            },
        ],
    });

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        }),
        vertex: {
            module: device.createShaderModule({
                code: fullQuad,
            }),
            entryPoint: 'vert_main',
        },
        fragment: {
            module: device.createShaderModule({
                code: externalCode,
            }),
            entryPoint: 'main',
            targets: [
                {
                    format: presentationFormat,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });
    const sampler2 = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
    });
    let counter = 0;

    // render
    const textCanvas = document.createElement('canvas');
    textCanvas.width = window.innerWidth;
    textCanvas.height = window.innerHeight;
    const textCtx = textCanvas.getContext('2d');
    textCtx.font = '250px "Bernard MT Condensed"';
    let text = 'FIJI';
    textCtx.textBaseline = 'middle';
    textCtx.textAlign = 'center';
    textCtx.fillText(text, textCanvas.width / 2, textCanvas.height / 2 - 200);

    let vh = window.innerHeight / 100;
    let vw = window.innerWidth / 100;

    textCtx.font = '30px "Bernard MT Condensed"';

    textCtx.fillRect(
        window.innerWidth / 2 - 6 * vw,
        window.innerHeight / 2 + 5 * vh,
        12 * vw,
        8 * vh
    );

    textCtx.globalCompositeOperation = 'destination-out';

    textCtx.fillStyle = '#ffffff';
    textCtx.fillText(
        'ENTER',
        window.innerWidth / 2,
        window.innerHeight / 2 + 9 * vh
    );

    const textTexture = webGPUTextureFromImageBitmapOrCanvas(
        device,
        textCanvas
    );

    async function frame(now) {
        const stagingBuffer = device.createBuffer({
            size: timeArray.byteLength,
            usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
        });

        await stagingBuffer.mapAsync(GPUMapMode.WRITE, 0, timeArray.byteLength);

        let staging = new Float32Array(
            stagingBuffer.getMappedRange(0, timeArray.byteLength)
        );

        staging[0] = now * 0.001;

        stagingBuffer.unmap();

        // MUST BE AFTER STAGING BUFFER
        const uniformBindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: sampler,
                },
                {
                    binding: 1,
                    resource: device.importExternalTexture({
                        source: video,
                    }),
                },
                {
                    binding: 2,
                    resource: sampler2,
                },
                {
                    binding: 3,
                    resource: textTexture.createView(),
                },
                {
                    binding: 4,
                    resource: {
                        buffer: timeBuffer,
                    },
                },
            ],
        });

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        commandEncoder.copyBufferToBuffer(
            stagingBuffer,
            0,
            timeBuffer,
            0,
            timeArray.byteLength
        );

        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        const passEncoder =
            commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.draw(6);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
        let end = performance.now();
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    // toji.dev
    function webGPUTextureFromImageBitmapOrCanvas(gpuDevice, source) {
        const textureDescriptor = {
            size: { width: source.width, height: source.height },
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        };
        const texture = gpuDevice.createTexture(textureDescriptor);

        gpuDevice.queue.copyExternalImageToTexture(
            { source },
            { texture },
            textureDescriptor.size
        );

        return texture;
    }
}
