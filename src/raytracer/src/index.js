const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 400;

let vw = 1;
let vh = 1;
let d = 1;

let printValue = 0;

function check() {
    console.log(printValue);
}

let scene = {
    spheres: {
        sphere1: {
            center: [0, -1, 3],
            radius: 1,
            color: [187, 68, 48],
            count: 0,
        },
        sphere2: {
            center: [2, 0, 4],
            radius: 1,
            color: [126, 189, 194],
            count: 0,
        },
        sphere: {
            center: [-2, 0, 4],
            radius: 1,
            color: [243, 223, 162],
            count: 0,
        },
        sphere3: {
            center: [1, 1, 4],
            radius: 0.1,
            color: [255, 255, 0],
            count: 0,
        },
    },
    lights: [
        { type: 'ambient', intensity: 0.2 },
        {
            type: 'directional',
            intensity: 0.2,
            direction: [1, 4, 4],
        },
        {
            type: 'point',
            intensity: 0.6,
            position: [2, 1, 0],
        },
    ],
};

origin = [0, 0, 0];
for (let x = -canvas.width / 2; x < canvas.width / 2; x++) {
    for (let y = -canvas.height / 2; y < canvas.height / 2; y++) {
        let direction = canvasToViewport(x, y);
        let color = traceRay(origin, direction, 1, Infinity);
        putPixel(x, y, color);
    }
}

function canvasToViewport(x, y) {
    return [(x * vw) / canvas.width, (y * vh) / canvas.height, d];
}

function traceRay(origin, direction, tMin, tMax) {
    let closestT = Infinity;
    let closestSphere = null;
    for (const sphere in scene.spheres) {
        let sphereD = scene.spheres[sphere];
        let [t1, t2] = intersectRaySphere(origin, direction, sphereD);
        if (t1 > tMin && t1 < tMax && t1 < closestT) {
            closestT = t1;
            closestSphere = sphereD;
        }
        if (t2 > tMin && t2 < tMax && t2 < closestT) {
            closestT = t2;
            closestSphere = sphereD;
        }
    }

    if (closestSphere === null) {
        return [255, 255, 255];
    }
    // Calculate intersection point
    let point = addVector(origin, vectorConstantProduct(direction, closestT));
    // Calculate normal vector
    let normal = subtractVector(point, closestSphere.center);
    // Unit normal vector
    normal = vectorConstantDivision(normal, vectorMagnitude3D(normal));

    let intensity = computeLighting(point, normal);
    printValue = vectorMagnitude3D(normal);
    return vectorConstantProduct(closestSphere.color, intensity);
}

function intersectRaySphere(origin, direction, sphere) {
    let r = sphere.radius;
    let CO = subtractVector(origin, sphere.center);

    let a = dot(direction, direction);
    let b = 2 * dot(CO, direction);
    let c = dot(CO, CO) - r * r;

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return [Infinity, Infinity];
    }
    let t1 = ((-b + Math.sqrt(discriminant)) / 2) * a;
    let t2 = ((-b - Math.sqrt(discriminant)) / 2) * a;
    return [t1, t2];
}

function computeLighting(point, normal) {
    let intensity = 0.0;
    for (const light of scene.lights) {
        if (light.type === 'ambient') {
            intensity += light.intensity;
        } else {
            let lightPoint = [0, 0, 0];
            if (light.type === 'point') {
                lightPoint = subtractVector(light.position, point);
            } else {
                lightPoint = light.direction;
            }

            let dotNormalToRay = dot(normal, lightPoint);
            if (dotNormalToRay > 0) {
                intensity +=
                    light.intensity *
                    (dotNormalToRay /
                        (vectorMagnitude3D(normal) *
                            vectorMagnitude3D(lightPoint)));
            }
        }
    }
    return intensity;
}

function addVector(vectorA, vectorB) {
    return vectorA.map((component, index) => component + vectorB[index]);
}

function vectorMagnitude3D(vector) {
    return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
}

function vectorConstantProduct(vector, constant) {
    return vector.map((component) => component * constant);
}

function vectorConstantDivision(vector, constant) {
    return vector.map((component) => component / constant);
}

function putPixel(x, y, color) {
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.fillRect(...convertCoord(x, y), 1, 1);
}

function convertCoord(x, y) {
    return [x + canvas.width / 2, canvas.height / 2 - y];
}

function subtractVector(vectorA, vectorB) {
    return vectorA.map((component, index) => component - vectorB[index]);
}

// Assumes vectorA is same dimension as vectorB
// Works for any dimension vector
function dot(vectorA, vectorB) {
    let product = 0;
    vectorA.forEach((component, index) => {
        product += component * vectorB[index];
    });
    return product;
}

export default check;
