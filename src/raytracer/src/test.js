function binarysearch(arr, target) {
    let array = arr;
    let low = 0;
    let high = array.length - 1;
    let found = false;
    let index = -1;

    while (low <= high && !found) {
        mid = Math.floor((low + high) / 2);
        if (array[mid] === target) {
            found = true;
            index = mid;
        } else if (array[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return index;
}

function linearsearch(arr, target) {
    let index = -1;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            index = i;
            break;
        }
    }
    return index;
}

function bubblesort(arr) {
    let array = arr;
    let swapped = false;
    for (let j = 0; j < array.length; j++) {
        for (let i = 0; i < array.length - j - 1; i++) {
            if (array[i] > array[i + 1]) {
                let temp = array[i + 1];
                array[i + 1] = array[i];
                array[i] = temp;
                swapped = true;
            }
        }
        if (!swapped) {
            break;
        }
    }
    return array;
}

function randomArray(length, upper) {
    let array = [];
    for (let i = 0; i < length; i++) {
        array.push(Math.floor(upper * Math.random()));
    }
    return array;
}

let count = 10000;
let findcount = 100000;
let arrayupper = 10000;

let linear = 0;
let binary = 0;

for (let i = 0; i < count; i++) {
    let array = randomArray(1, arrayupper);
    array = bubblesort(array);

    let start = performance.now();
    for (let j = 0; j < findcount; j++) {
        let index = Math.floor(Math.random() * array.length);
        let result = binarysearch(array, array[index]);
    }
    let end = performance.now();

    binary += Math.floor((start - end) / findcount);

    start = performance.now();
    for (let j = 0; j < findcount; j++) {
        let index = Math.floor(Math.random() * array.length);
        let result = linearsearch(array, array[index]);
    }
    end = performance.now();
    linear += Math.floor((start - end) / findcount);
}

console.log(`BINARY SEARCH: ${Math.floor(binary / count)}`);
console.log(`LINEAR SEARCH: ${Math.floor(linear / count)}`);
