// toji.dev

var k = {
        'image/jpeg': 'rgb8unorm',
        'image/png': 'rgba8unorm',
        'image/apng': 'rgba8unorm',
        'image/gif': 'rgba8unorm',
        'image/bmp': 'rgb8unorm',
        'image/webp': 'rgba8unorm',
        'image/x-icon': 'rgba8unorm',
        'image/svg+xml': 'rgba8unorm',
    },
    R = typeof createImageBitmap != 'undefined',
    E = class {
        constructor() {}
        static supportedMIMETypes() {
            return Object.keys(k);
        }
        async fromUrl(e, r, t) {
            let o = k[t.mimeType];
            if (
                (e.supportedFormatList.indexOf(o) == -1 && (o = 'rgba8unorm'),
                R)
            ) {
                let s = await fetch(r),
                    i = await createImageBitmap(await s.blob());
                return e.fromImageBitmap(i, o, t);
            } else
                return new Promise((s, i) => {
                    let c = new Image();
                    c.addEventListener('load', () => {
                        s(e.textureFromImageElement(c, o, t));
                    }),
                        c.addEventListener('error', function (n) {
                            i(n);
                        }),
                        (c.src = r);
                });
        }
        async fromBlob(e, r, t) {
            let o = k[r.type];
            if (
                (e.supportedFormatList.indexOf(o) == -1 && (o = 'rgba8unorm'),
                R)
            ) {
                let s = await createImageBitmap(r);
                return e.fromImageBitmap(s, o, t);
            } else
                return new Promise((s, i) => {
                    let c = new Image();
                    c.addEventListener('load', () => {
                        s(e.fromImageElement(c, o, t));
                    }),
                        c.addEventListener('error', function (g) {
                            i(g);
                        });
                    let n = window.URL.createObjectURL(r);
                    c.src = n;
                });
        }
        async fromBuffer(e, r, t) {
            let o = new Blob(r, { type: t.mimeType });
            return this.fromBlob(e, o, t);
        }
        destroy() {}
    };
var z = import.meta.url.replace(/[^\/]*$/, ''),
    H = 4,
    L = class {
        constructor(e, r, t, o) {
            (this.client = e),
                (this.options = r),
                (this.resolve = t),
                (this.reject = o);
        }
    },
    d = {},
    C = 1;
function X(a) {
    let e = d[a.data.id];
    if (!e) {
        a.data.error && console.error(`Texture load failed: ${a.data.error}`),
            console.error(`Invalid pending texture ID: ${a.data.id}`);
        return;
    }
    if ((delete d[a.data.id], a.data.error)) {
        console.error(`Texture load failed: ${a.data.error}`),
            e.reject(`${a.data.error}`);
        return;
    }
    let r = e.client.fromTextureData(a.data, e.options);
    e.resolve(r);
}
var b = class {
    constructor(e) {
        (this.workerPath = `${z}${e}`),
            (this.workerPool = []),
            (this.nextWorker = 0),
            (this.outstandingRequests = 0),
            this.addWorker();
    }
    addWorker() {
        let e = new Worker(this.workerPath);
        return (
            (e.onmessage = (r) => {
                X(r), this.outstandingRequests--;
            }),
            this.workerPool.push(e),
            e
        );
    }
    selectWorker() {
        return (
            this.outstandingRequests++,
            this.outstandingRequests >= this.workerPool.length &&
            this.workerPool.length < H
                ? this.addWorker()
                : this.workerPool[this.nextWorker++ % this.workerPool.length]
        );
    }
    async fromUrl(e, r, t) {
        let o = C++;
        return (
            this.selectWorker().postMessage({
                id: o,
                url: r,
                supportedFormats: e.supportedFormats(),
                mipmaps: t.mipmaps,
                extension: t.extension,
            }),
            new Promise((s, i) => {
                d[o] = new L(e, t, s, i);
            })
        );
    }
    async fromBlob(e, r, t) {
        let o = await r.arrayBuffer();
        return this.fromBuffer(e, o, t);
    }
    async fromBuffer(e, r, t) {
        let o = C++;
        return (
            this.selectWorker().postMessage({
                id: o,
                buffer: r,
                supportedFormats: e.supportedFormats(),
                mipmaps: t.mipmaps,
                extension: t.extension,
            }),
            new Promise((s, i) => {
                d[o] = new L(e, t, s, i);
            })
        );
    }
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            let e = new Error('Texture loader was destroyed.');
            for (let r of d) r.reject(e);
        }
    }
};
var u = WebGLRenderingContext,
    p = {
        rgb8unorm: {
            canGenerateMipmaps: !0,
            gl: { format: u.RGB, type: u.UNSIGNED_BYTE, sizedFormat: 32849 },
        },
        rgba8unorm: {
            canGenerateMipmaps: !0,
            gl: { format: u.RGBA, type: u.UNSIGNED_BYTE, sizedFormat: 32856 },
        },
        'rgb8unorm-srgb': {
            canGenerateMipmaps: !0,
            gl: { format: u.RGBA, type: u.UNSIGNED_BYTE, sizedFormat: 35907 },
        },
        'rgba8unorm-srgb': {
            canGenerateMipmaps: !0,
            gl: { format: u.RGBA, type: u.UNSIGNED_BYTE, sizedFormat: 35907 },
        },
        rgb565unorm: {
            canGenerateMipmaps: !0,
            gl: {
                format: u.RGB,
                type: u.UNSIGNED_SHORT_5_6_5,
                sizedFormat: u.RGB565,
            },
        },
        rgba4unorm: {
            canGenerateMipmaps: !0,
            gl: {
                format: u.RGBA,
                type: u.UNSIGNED_SHORT_4_4_4_4,
                sizedFormat: u.RGBA4,
            },
        },
        rgba5551unorm: {
            canGenerateMipmaps: !0,
            gl: {
                format: u.RGBA,
                type: u.UNSIGNED_SHORT_5_5_5_1,
                sizedFormat: u.RGB5_A1,
            },
        },
        bgra8unorm: { canGenerateMipmaps: !0 },
        'bgra8unorm-srgb': { canGenerateMipmaps: !0 },
        rg11b10ufloat: {
            canGenerateMipmaps: !1,
            gl: { format: u.RGB, type: 35899, sizedFormat: 35898 },
        },
        'bc1-rgb-unorm': {
            gl: { texStorage: !0, sizedFormat: 33776 },
            compressed: { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
        },
        'bc2-rgba-unorm': {
            gl: { texStorage: !0, sizedFormat: 33778 },
            compressed: { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
        },
        'bc3-rgba-unorm': {
            gl: { texStorage: !1, sizedFormat: 33779 },
            compressed: { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
        },
        'bc7-rgba-unorm': {
            gl: { texStorage: !0, sizedFormat: 36492 },
            compressed: { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
        },
        'etc1-rgb-unorm': {
            gl: { texStorage: !1, sizedFormat: 36196 },
            compressed: { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
        },
        'etc2-rgba8unorm': {
            gl: { texStorage: !0, sizedFormat: 37496 },
            compressed: { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
        },
        'astc-4x4-rgba-unorm': {
            gl: { texStorage: !0, sizedFormat: 37808 },
            compressed: { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
        },
        'pvrtc1-4bpp-rgb-unorm': {
            gl: { texStorage: !1, sizedFormat: 35840 },
            compressed: { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
        },
        'pvrtc1-4bpp-rgba-unorm': {
            gl: { texStorage: !1, sizedFormat: 35842 },
            compressed: { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
        },
    };
var v = class {
        constructor(e, r = {}) {
            (this.texture = e),
                (this.width = r.width || 1),
                (this.height = r.height || 1),
                (this.depth = r.depth || 1),
                (this.mipLevels = r.mipLevels || 1),
                (this.format = r.format || 'rgba8unorm'),
                (this.type = r.type || '2d');
        }
        get glFormat() {
            return p[this.format].gl.format || null;
        }
        get glSizedFormat() {
            return p[this.format].gl.sizedFormat;
        }
        get glTarget() {
            switch (this.type) {
                case 'cube':
                    return GL.TEXTURE_CUBE_MAP;
                case '2d':
                default:
                    return GL.TEXTURE_2D;
            }
        }
    },
    G = class {
        constructor(e, r, t, o = null, s = {}) {
            (this.format = e),
                (this.width = Math.max(1, r)),
                (this.height = Math.max(1, t)),
                (this.levels = []),
                o && this.getLevel(0).setSlice(0, o, s);
        }
        getLevel(e, r = {}) {
            let t = this.levels[e];
            return t || ((t = new F(this, e, r)), (this.levels[e] = t)), t;
        }
    },
    F = class {
        constructor(e, r, t) {
            (this.textureData = e),
                (this.levelIndex = r),
                (this.width = Math.max(
                    1,
                    t.width || this.textureData.width >> r
                )),
                (this.height = Math.max(
                    1,
                    t.height || this.textureData.height >> r
                )),
                (this.slices = []);
        }
        setSlice(e, r, t = {}) {
            if (this.slices[e] != null)
                throw new Error('Cannot define an image slice twice.');
            let o = t.byteOffset || 0,
                s = t.byteLength || 0,
                i;
            r instanceof ArrayBuffer
                ? ((i = r), s || (s = i.byteLength - o))
                : ((i = r.buffer),
                  s || (s = r.byteLength - o),
                  (o += r.byteOffset)),
                (this.slices[e] = { buffer: i, byteOffset: o, byteLength: s });
        }
    },
    f = class {
        constructor(e, r) {
            (this.mimeTypes = e), (this.callback = r), (this.loader = null);
        }
        getLoader() {
            return this.loader || (this.loader = this.callback()), this.loader;
        }
    },
    _ = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        apng: 'image/apng',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
        ico: 'image/x-icon',
        cur: 'image/x-icon',
        svg: 'image/svg+xml',
        basis: 'image/basis',
        ktx: 'image/ktx',
        ktx2: 'image/ktx2',
        dds: 'image/vnd.ms-dds',
    },
    P = [
        new f(E.supportedMIMETypes(), () => new E()),
        new f(['image/basis'], () => new b('workers/basis/basis-worker.js')),
        new f(
            ['image/ktx', 'image/ktx2'],
            () => new b('workers/ktx/ktx-worker.js')
        ),
        new f(['image/vnd.ms-dds'], () => new b('workers/dds-worker.js')),
    ],
    m = Symbol('wtt/WebTextureClient'),
    w = Symbol('wtt/WebTextureLoaders'),
    M = document.createElement('a'),
    Y = typeof createImageBitmap != 'undefined',
    x = { mimeType: null, mipmaps: !0, colorSpace: 'default' };
function I(a, e) {
    if (!e) throw new Error('A valid MIME type must be specified.');
    let r = a[w][e];
    r || (r = a[w]['*']);
    let t = r.getLoader();
    if (!t) throw new Error(`Failed to get loader for MIME type "${e}"`);
    return t;
}
var B = class {
    constructor(e) {
        (this[m] = e), (this[w] = {});
        for (let r of P) for (let t of r.mimeTypes) this[w][t] = r;
        this[w]['*'] = P[0];
    }
    async fromUrl(e, r) {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        let t = Object.assign({}, x, r);
        if (((M.href = e), !t.mimeType)) {
            let s = M.pathname.lastIndexOf('.'),
                i = s > -1 ? M.pathname.substring(s + 1).toLowerCase() : '*';
            t.mimeType = _[i];
        }
        return I(this, t.mimeType).fromUrl(this[m], M.href, t);
    }
    async fromBlob(e, r) {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        let t = Object.assign({}, x, r);
        return I(this, e.type).fromBlob(this[m], e, t);
    }
    async fromBuffer(e, r) {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        let t = Object.assign({}, x, r);
        if (!t.mimeType && t.filename) {
            let s = t.filename.lastIndexOf('.'),
                i = s > -1 ? t.filename.substring(s + 1).toLowerCase() : null;
            t.mimeType = _[i];
        }
        return I(this, t.mimeType).fromBuffer(this[m], e, t);
    }
    async fromElement(e, r) {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        let t = Object.assign({}, x, r);
        if (!Y) return this[m].textureFromImageElement(e, 'rgba8unorm', t);
        let o = await createImageBitmap(e);
        return this[m].fromImageBitmap(o, 'rgba8unorm', t);
    }
    async fromImageBitmap(e, r) {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        let t = Object.assign({}, x, r);
        return this[m].fromImageBitmap(e, 'rgba8unorm', t);
    }
    fromColor(e, r, t, o = 1, s = 'rgba8unorm') {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        if (s != 'rgba8unorm' && s != 'rgba8unorm-srgb')
            throw new Error(
                'fromColor only supports "rgba8unorm" and "rgba8unorm-srgb" formats'
            );
        let i = new Uint8Array([e * 255, r * 255, t * 255, o * 255]);
        return this[m].fromTextureData(new G(s, 1, 1, i), !1);
    }
    fromNoise(e, r) {
        if (!this[m])
            throw new Error(
                'Cannot create new textures after object has been destroyed.'
            );
        let t = new Uint8Array(e * r * 4);
        for (let o = 0; o < t.length; ++o) t[o] = Math.random() * 255;
        return this[m].fromTextureData(new G('rgba8unorm', e, r, t), !1);
    }
    set allowCompressedFormats(e) {
        this[m].allowCompressedFormats = !!e;
    }
    get allowCompressedFormats() {
        return this[m].allowCompressedFormats;
    }
    set allowTexStorage(e) {
        this[m].allowTexStorage = !!e;
    }
    get allowTexStorage() {
        return this[m].allowTexStorage;
    }
    destroy() {
        this[m] && (this[m].destroy(), (this[m] = null));
    }
};
var S = class {
    constructor(e) {
        (this.device = e),
            (this.sampler = e.createSampler({ minFilter: 'linear' })),
            (this.pipelines = {});
    }
    getMipmapPipeline(e) {
        let r = this.pipelines[e];
        return (
            r ||
                (this.mipmapShaderModule ||
                    ((this.mipmapShaderModule = this.device.createShaderModule({
                        label: 'Mipmap Generator',
                        code: `
            var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
              vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));

            struct VertexOutput {
              @builtin(position) position : vec4<f32>,
              @location(0) texCoord : vec2<f32>,
            };

            @vertex
            fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
              var output : VertexOutput;
              output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
              output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
              return output;
            }

            @group(0) @binding(0) var imgSampler : sampler;
            @group(0) @binding(1) var img : texture_2d<f32>;

            @fragment
            fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
              return textureSample(img, imgSampler, texCoord);
            }
          `,
                    })),
                    (this.bindGroupLayout = this.device.createBindGroupLayout({
                        label: 'Mipmap Generator',
                        entries: [
                            {
                                binding: 0,
                                visibility: GPUShaderStage.FRAGMENT,
                                sampler: {},
                            },
                            {
                                binding: 1,
                                visibility: GPUShaderStage.FRAGMENT,
                                texture: {},
                            },
                        ],
                    })),
                    (this.pipelineLayout = this.device.createPipelineLayout({
                        label: 'Mipmap Generator',
                        bindGroupLayouts: [this.bindGroupLayout],
                    }))),
                (r = this.device.createRenderPipeline({
                    layout: this.pipelineLayout,
                    vertex: {
                        module: this.mipmapShaderModule,
                        entryPoint: 'vertexMain',
                    },
                    fragment: {
                        module: this.mipmapShaderModule,
                        entryPoint: 'fragmentMain',
                        targets: [{ format: e }],
                    },
                })),
                (this.pipelines[e] = r)),
            r
        );
    }
    generateMipmap(e, r) {
        let t = this.getMipmapPipeline(r.format);
        if (r.dimension == '3d' || r.dimension == '1d')
            throw new Error(
                'Generating mipmaps for non-2d textures is currently unsupported!'
            );
        let o = e,
            s = r.size.depthOrArrayLayers || 1,
            i = r.usage & GPUTextureUsage.RENDER_ATTACHMENT;
        if (!i) {
            let n = {
                size: {
                    width: Math.ceil(r.size.width / 2),
                    height: Math.ceil(r.size.height / 2),
                    depthOrArrayLayers: s,
                },
                format: r.format,
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_SRC |
                    GPUTextureUsage.RENDER_ATTACHMENT,
                mipLevelCount: r.mipLevelCount - 1,
            };
            o = this.device.createTexture(n);
        }
        let c = this.device.createCommandEncoder({});
        for (let n = 0; n < s; ++n) {
            let g = e.createView({
                    baseMipLevel: 0,
                    mipLevelCount: 1,
                    dimension: '2d',
                    baseArrayLayer: n,
                    arrayLayerCount: 1,
                }),
                l = i ? 1 : 0;
            for (let y = 1; y < r.mipLevelCount; ++y) {
                let h = o.createView({
                        baseMipLevel: l++,
                        mipLevelCount: 1,
                        dimension: '2d',
                        baseArrayLayer: n,
                        arrayLayerCount: 1,
                    }),
                    T = c.beginRenderPass({
                        colorAttachments: [
                            { view: h, loadOp: 'clear', storeOp: 'store' },
                        ],
                    }),
                    j = this.device.createBindGroup({
                        layout: this.bindGroupLayout,
                        entries: [
                            { binding: 0, resource: this.sampler },
                            { binding: 1, resource: g },
                        ],
                    });
                T.setPipeline(t),
                    T.setBindGroup(0, j),
                    T.draw(3, 1, 0, 0),
                    T.end(),
                    (g = h);
            }
        }
        if (!i) {
            let n = {
                width: Math.ceil(r.size.width / 2),
                height: Math.ceil(r.size.height / 2),
                depthOrArrayLayers: s,
            };
            for (let g = 1; g < r.mipLevelCount; ++g)
                c.copyTextureToTexture(
                    { texture: o, mipLevel: g - 1 },
                    { texture: e, mipLevel: g },
                    n
                ),
                    (n.width = Math.ceil(n.width / 2)),
                    (n.height = Math.ceil(n.height / 2));
        }
        return this.device.queue.submit([c.finish()]), i || o.destroy(), e;
    }
};
var $ = typeof createImageBitmap != 'undefined',
    U = {
        'texture-compression-bc': [
            'bc1-rgba-unorm',
            'bc1-rgba-unorm-srgb',
            'bc2-rgba-unorm',
            'bc2-rgba-unorm-srgb',
            'bc3-rgba-unorm',
            'bc3-rgba-unorm-srgb',
            'bc7-rgba-unorm',
            'bc7-rgba-unorm-srgb',
        ],
        'texture-compression-etc2': [
            'etc2-rgb8unorm',
            'etc2-rgb8unorm-srgb',
            'etc2-rgb8a1unorm',
            'etc2-rgb8a1unorm-srgb',
            'etc2-rgba8unorm',
            'etc2-rgba8unorm-srgb',
            'eac-r11unorm',
            'eac-r11snorm',
            'eac-rg11unorm',
            'eac-rg11snorm',
        ],
    },
    q = {
        rgb8unorm: 'rgb8unorm-srgb',
        rgba8unorm: 'rgba8unorm-srgb',
        bgra8unorm: 'bgra8unorm-srgb',
        'bc1-rgba-unorm': 'bc1-rgba-unorm-srgb',
        'bc2-rgba-unorm': 'bc2-rgba-unorm-srgb',
        'bc3-rgba-unorm': 'bc3-rgba-unorm-srgb',
        'bc7-rgba-unorm': 'bc7-rgba-unorm-srgb',
        'etc2-rgb8unorm': 'etc2-rgb8unorm-srgb',
        'etc2-rgb8a1unorm': 'etc2-rgb8a1unorm-srgb',
        'etc2-rgba8unorm': 'etc2-rgba8unorm-srgb',
    },
    D = {
        'rgb8unorm-srgb': 'rgb8unorm',
        'rgba8unorm-srgb': 'rgba8unorm',
        'bgra8unorm-srgb': 'bgra8unorm',
        'bc1-rgba-unorm-srgb': 'bc1-rgba-unorm',
        'bc2-rgba-unorm-srgb': 'bc2-rgba-unorm',
        'bc3-rgba-unorm-srgb': 'bc3-rgba-unorm',
        'bc7-rgba-unorm-srgb': 'bc7-rgba-unorm',
        'etc2-rgb8unorm-srgb': 'etc2-rgb8unorm',
        'etc2-rgb8a1unorm-srgb': 'etc2-rgb8a1unorm',
        'etc2-rgba8unorm-srgb': 'etc2-rgba8unorm',
    };
function O(a, e) {
    switch (e) {
        case 'sRGB':
            return q[a] || a;
        case 'linear':
            return D[a] || a;
        default:
            return a;
    }
}
function A(a, e) {
    return Math.floor(Math.log2(Math.max(a, e))) + 1;
}
var N = class extends B {
        constructor(e, r) {
            super(new W(e), r);
        }
    },
    W = class {
        constructor(e) {
            (this.device = e),
                (this.allowCompressedFormats = !0),
                (this.uncompressedFormatList = [
                    'rgba8unorm',
                    'rgba8unorm-srgb',
                    'bgra8unorm',
                    'bgra8unorm-srgb',
                    'rg11b10ufloat',
                ]),
                (this.supportedFormatList = [
                    'rgba8unorm',
                    'rgba8unorm-srgb',
                    'bgra8unorm',
                    'bgra8unorm-srgb',
                    'rg11b10ufloat',
                ]);
            let r = e.features;
            if (r) {
                for (let t in U)
                    if (r.has(t)) {
                        let o = U[t];
                        this.supportedFormatList.push(...o);
                    }
            }
            this.mipmapGenerator = new S(e);
        }
        supportedFormats() {
            return this.allowCompressedFormats
                ? this.supportedFormatList
                : this.uncompressedFormatList;
        }
        async fromImageBitmap(e, r, t) {
            if (!this.device)
                throw new Error(
                    'Cannot create new textures after object has been destroyed.'
                );
            let o = t.mipmaps,
                s = o ? A(e.width, e.height) : 1,
                i =
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
                c = {
                    size: { width: e.width, height: e.height },
                    format: O(r, t.colorSpace),
                    usage: i,
                    mipLevelCount: s,
                },
                n = this.device.createTexture(c);
            return (
                this.device.queue.copyExternalImageToTexture(
                    { source: e },
                    { texture: n },
                    c.size
                ),
                o && this.mipmapGenerator.generateMipmap(n, c),
                new v(n, {
                    width: e.width,
                    height: e.height,
                    mipLevels: s,
                    format: r,
                })
            );
        }
        async fromImageElement(e, r, t) {
            if (!this.device)
                throw new Error(
                    'Cannot create new textures after object has been destroyed.'
                );
            if (!$)
                throw new Error(
                    'Must support ImageBitmap to use WebGPU. (How did you even get to this error?)'
                );
            let o = await createImageBitmap(e);
            return this.textureFromImageBitmap(o, r, t);
        }
        fromTextureData(e, r) {
            if (!this.device)
                throw new Error(
                    'Cannot create new textures after object has been destroyed.'
                );
            let t = p[e.format];
            if (!t) throw new Error(`Unknown format "${e.format}"`);
            let o = t.compressed || {
                    blockBytes: 4,
                    blockWidth: 1,
                    blockHeight: 1,
                },
                s = r.mipmaps && t.canGenerateMipmaps,
                i =
                    e.levels.length > 1
                        ? e.levels.length
                        : s
                        ? A(e.width, e.height)
                        : 1,
                c = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
                n = {
                    size: {
                        width: Math.ceil(e.width / o.blockWidth) * o.blockWidth,
                        height:
                            Math.ceil(e.height / o.blockHeight) * o.blockHeight,
                        depthOrArrayLayers: e.depth,
                    },
                    format: O(e.format, r.colorSpace),
                    usage: c,
                    mipLevelCount: i,
                },
                g = this.device.createTexture(n);
            for (let l of e.levels) {
                let y = Math.ceil(l.width / o.blockWidth) * o.blockBytes;
                for (let h of l.slices)
                    this.device.queue.writeTexture(
                        {
                            texture: g,
                            mipLevel: l.levelIndex,
                            origin: { z: h.sliceIndex },
                        },
                        h.buffer,
                        { offset: h.byteOffset, bytesPerRow: y },
                        {
                            width:
                                Math.ceil(l.width / o.blockWidth) *
                                o.blockWidth,
                            height:
                                Math.ceil(l.height / o.blockHeight) *
                                o.blockHeight,
                        }
                    );
            }
            return (
                s && this.mipmapGenerator.generateMipmap(g, n),
                new v(g, {
                    width: e.width,
                    height: e.height,
                    depth: e.depth,
                    mipLevels: i,
                    format: e.format,
                    type: e.type,
                })
            );
        }
        destroy() {
            this.device = null;
        }
    };
export { N as WebGPUTextureLoader };
//# sourceMappingURL=webgpu-texture-loader.js.map
