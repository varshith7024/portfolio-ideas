const dispatchCount = [1920, 1, 1080];
const workgroupSize = [16, 16, 1];

// multiply all elements of an array
const arrayProd = (arr) => arr.reduce((a, b) => a * b);

const numThreadsPerWorkgroup = arrayProd(workgroupSize);

const cs1 = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> video: array<u32>;
@group(0) @binding(1) var<storage, read_write> compare: array<f32>;

@compute @workgroup_size(${workgroupSize}) fn computeSomething(
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_id) local_invocation_id : vec3<u32>,
    @builtin(global_invocation_id) global_invocation_id : vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32,
    @builtin(num_workgroups) num_workgroups: vec3<u32>
) {
    let workgroup_index =  
    workgroup_id.x +
    workgroup_id.y * num_workgroups.x +
    workgroup_id.z * num_workgroups.x * num_workgroups.y;

    let global_invocation_index =
     workgroup_index * ${numThreadsPerWorkgroup} +
     local_invocation_index;

    let i = global_invocation_index;
    video[i] = 100;
    
    
    compare[i] = 100;
}
`;

let video = document.createElement('video');
video.loop = true;
video.autoplay = true;
video.muted = true;
video.src = './assets/bg.mp4';
await video.play();

const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();

let width = 1920;
let height = 1080;

let canvas = document.getElementById('canvas');
canvas.width = width;
canvas.height = height;
let ctx = canvas.getContext('2d', {
    // actually faster
    willReadFrequently: false,
});

let canvas2 = document.getElementById('canvas2');
canvas2.width = width;
canvas2.height = height;
let ctx2 = canvas2.getContext('2d');

if (!device) {
    console.error('Not supported');
}

let fpsArray = [];

async function main() {
    let start = performance.now();

    ctx.drawImage(video, 0, 0);

    let data = ctx.getImageData(0, 0, width, height);

    const input = new Float32Array(data.data);

    let array2 = Array(100000);
    let compare = new Float32Array(array2);

    async function executeCS(code) {
        const module = device.createShaderModule({
            label: 'cs1',
            code: code,
        });

        const pipeline = device.createComputePipeline({
            label: 'doubling compute pipeline',
            layout: 'auto',
            compute: {
                module,
                entryPoint: 'computeSomething',
            },
        });

        const workBuffer = device.createBuffer({
            label: 'work buffer',
            size: input.byteLength,
            usage:
                GPUBufferUsage.STORAGE |
                GPUBufferUsage.COPY_SRC |
                GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(workBuffer, 0, input);

        const comparisionBuffer = device.createBuffer({
            label: 'comparing buffer',
            size: input.byteLength,
            usage:
                GPUBufferUsage.STORAGE |
                GPUBufferUsage.COPY_SRC |
                GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(comparisionBuffer, 0, compare);

        const resultBuffer = device.createBuffer({
            label: 'result buffer',
            size: input.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        const bindGroup = device.createBindGroup({
            label: 'bind group for objects',
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: workBuffer } },
                { binding: 1, resource: { buffer: comparisionBuffer } },
            ],
        });
        const encoder = device.createCommandEncoder({
            label: 'doubling encoder',
        });
        const pass = encoder.beginComputePass({
            label: 'doubling compute pass',
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(...dispatchCount);
        pass.end();

        encoder.copyBufferToBuffer(
            workBuffer,
            0,
            resultBuffer,
            0,
            resultBuffer.size
        );

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        await resultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(resultBuffer.getMappedRange().slice());
        resultBuffer.unmap();

        //test(result);
        let canvasData = new Uint8ClampedArray(result);
        let canvasImage = new ImageData(canvasData, width, height);
        //console.log(canvasImage);

        ctx2.putImageData(canvasImage, 0, 0);
        // console.log('result', result);
    }

    await executeCS(cs1);
    let end = performance.now();

    // console.log(
    //     `Execution time: ${Math.floor(1000 / (Math.floor(end - start) / 3))}fps`
    // );

    document.getElementById('fps').innerText = `Execution time: ${Math.floor(
        1000 / (Math.floor(end - start) / 3)
    )}fps`;

    fpsArray.push(Math.floor(1000 / (Math.floor(end - start) / 3)));

    video.requestVideoFrameCallback(main);
}

function average(array) {
    let total = 0;
    for (let i = 0; i < array.length; i++) {
        total += array[i];
    }
    return total / array.length;
}

function test(array) {
    let max = 0;
    for (let i = 0; i < array.length; i++) {
        if (array[i] === 100) {
            max = i;
        }
    }
    console.log(max);
}

document.getElementById('fpsB').onclick = () => {
    console.log(average(fpsArray));
};

video.requestVideoFrameCallback(main);
