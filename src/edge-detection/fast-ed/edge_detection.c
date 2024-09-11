#include "lodepng/lodepng.h"
#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include <math.h>

#define PI 3.14

const char *filename_in = "test.png";
const char *filename_out = "out.png";

const int blur_size = 7;
const float high_threshold = 0.12;
const float low_threshold = 0.09;
const unsigned char high_value = 255;
const unsigned char low_value = 25;

struct sobel_data
{
    unsigned char *magnitude;
    double *edge_directions;
};

void greyscale(unsigned char **image, int width, int height)
{
    unsigned char *data = *image;
    for (int i = 0; i < width * height * 4; i += 4)
    {
        char red = data[i];
        char green = data[i + 1];
        char blue = data[i + 2];

        // ITU-R recommendation (BT.709)
        char grey = (char)((float)red * 0.2126 + (float)green * 0.7152 + (float)blue * 0.0722);
        data[i] = grey;
        data[i + 1] = grey;
        data[i + 2] = grey;
    }
}

void box_blur_single_channel(unsigned char **image, int width, int height)
{
    unsigned char *data = *image;

    int len = width * height;
    int blur_radius = (int)(blur_size / 2);

    for (int i = 0; i < len; i++)
    {

        if (i - (width + blur_radius) < 0 || i + (width + blur_radius) > len - 1)
        {
            continue;
        }
        float coeff = (float)(1.0 / (blur_size * blur_size));
        float average = 0.0;
        // add center pixel
        average += (float)data[i] * coeff;

        for (int j = 1; j <= blur_radius; j++)
        {
            average += (float)data[i - (width * j)] * coeff;
            average += (float)data[i + (width * j)] * coeff;
            average += (float)data[i + j] * coeff;
            average += (float)data[i - j] * coeff;

            for (int k = 1; k <= blur_radius; k++)
            {
                average += (float)data[i - (width * j) - k] * coeff;
                average += (float)data[i - (width * j) + k] * coeff;
                average += (float)data[i + (width * j) - k] * coeff;
                average += (float)data[i + (width * j) + k] * coeff;
            }
        }

        data[i] = (unsigned char)(average);
    }
}

void sobel_convolution_x(unsigned char **image, int width, int height)
{

    int len = width * height;
    unsigned char *data = *image;
    int *temp = calloc(len, sizeof(int));

    for (int i = 0; i < len; i++)
    {
        if (i - (width + 1) < 0 || i + (width + 1) > len - 1)
        {
            continue;
        }

        int total = 0;

        total = -data[i - width - 1] - 2 * data[i - width] - data[i - width + 1] +
                data[i + width - 1] + 2 * data[i + width] + data[i + width + 1];

        temp[i] = (unsigned char)fabs(total);
    }

    for (int i = 0; i < len; i++)
    {
        data[i] = (unsigned char)fmin(fmax(fabs(temp[i]), 0), 255);
    }

    free(temp);
}

void sobel_convolution_y(unsigned char **image, int width, int height)
{
    int len = width * height;
    unsigned char *data = *image;

    int *temp = calloc(len, sizeof(int));

    for (int i = 0; i < len; i++)
    {
        if (i - (width + 1) < 0 || i + (width + 1) > len - 1)
        {
            continue;
        }

        int total = 0;

        total = -data[i - width - 1] - 2 * data[i - 1] - data[i + width - 1] +
                data[i - width + 1] + 2 * data[i + 1] + data[i + width + 1];

        temp[i] = (unsigned char)fabs(total);
    }

    for (int i = 0; i < len; i++)
    {
        data[i] = (unsigned char)fmin(fmax(fabs(temp[i]), 0), 255);
    }

    free(temp);
}

struct sobel_data sobel_convolution(unsigned char **image, int width, int height)
{
    unsigned char *data = *image;
    // Make two copies for both passes;
    unsigned char *vertical = calloc(width * height, sizeof(unsigned char));
    memcpy(vertical, data, sizeof(unsigned char) * (height * width));
    unsigned char *horizontal = calloc(width * height, sizeof(unsigned char));
    memcpy(horizontal, data, sizeof(unsigned char) * (height * width));

    // Apply both passes
    sobel_convolution_y(&vertical, width, height);
    sobel_convolution_x(&horizontal, width, height);

    struct sobel_data result;
    result.magnitude = calloc(width * height, sizeof(unsigned char));
    result.edge_directions = calloc(width * height, sizeof(double));

    int len = width * height;

    for (int i = 0; i < len; i++)
    {
        if (vertical[i] != 0 && horizontal[i] == 0)
        {
            result.magnitude[i] = 0;
            result.edge_directions[i] = 0;

            continue;
        }
        int magnitude = (int)(sqrt(
            (double)(vertical[i] * vertical[i] + horizontal[i] * horizontal[i])));
        result.magnitude[i] = magnitude;

        double direction = atan2((double)vertical[i], (double)horizontal[i]);
        result.edge_directions[i] = direction;
    }

    // Free arrays
    free(vertical);
    free(horizontal);

    return result;
}

void cleanup_sobel_data(struct sobel_data *sobel_data)
{
    free(sobel_data->magnitude);
    free(sobel_data->edge_directions);
}

unsigned char *non_maximum_supression(struct sobel_data *sobel_data, int width, int height)
{
    unsigned char *result = calloc(width * height, sizeof(unsigned char));
    int len = width * height;
    for (int i = 0; i < len; i++)
    {
        if (sobel_data->magnitude[i] != 0 || (i - width - 1) < 0 || (i + width + 1) > len - 1)
        {
            char q = 0;
            char r = 0;

            if (sobel_data->edge_directions[i] > 0.0 && sobel_data->edge_directions[i] < (double)(PI / 4.0))
            {
                q = sobel_data->magnitude[i + 1];
                r = sobel_data->magnitude[i - 1];
            }
            else if (sobel_data->edge_directions[i] > (double)(PI / 4.0) && sobel_data->edge_directions[i] < (double)(PI / 2.0))
            {
                q = sobel_data->magnitude[i + width + 1];
                r = sobel_data->magnitude[i - width - 1];
            }
            else if (sobel_data->edge_directions[i] > (double)(-PI / 2.0) && sobel_data->edge_directions[i] < (double)(-PI / 4.0))
            {
                q = sobel_data->magnitude[i + width - 1];
                r = sobel_data->magnitude[i - width + 1];
            }
            else if (sobel_data->edge_directions[i] > (double)(-PI / 4.0) && sobel_data->edge_directions[i] < (double)(0.0))
            {
                q = sobel_data->magnitude[i + width];
                r = sobel_data->magnitude[i - width];
            }

            if (sobel_data->magnitude[i] > q && sobel_data->magnitude[i] > r)
            {
                result[i] = sobel_data->magnitude[i];
            }
        }
        else
        {
            result[i] = sobel_data->magnitude[i];
        }
    }
    return result;
}

void double_threshold(unsigned char **values, int width, int height)
{
    unsigned char *data = *values;
    unsigned char high = (unsigned char)(high_threshold * 255.0);
    unsigned char low = (unsigned char)(low_threshold * 255.0);
    int len = height * width;

    for (int i = 0; i < len; i++)
    {
        if (data[i] > high)
        {
            data[i] = high_value;
        }
        else if (data[i] < high && data[i] > low)
        {
            data[i] = low_value;
        }
        else
        {
            data[i] = 0;
        }
    }
}

void hysteresis_edge_tracking(unsigned char **values, int width, int height)
{
    unsigned char *data = *values;
    unsigned char *temp = calloc(width * height, sizeof(unsigned char));
    int len = width * height;
    for (int i = 0; i < len; i++)
    {
        if (data[i] == high_value)
        {
            temp[i] = high_value;
            continue;
        }
        else if (data[i] == low_value || i - (width + 1) > 0 || i + (width + 1) < len - 1)
        {
            if (data[i - 1] == high_value ||
                data[i + 1] == high_value ||
                data[i + width] == high_value ||
                data[i - width] == high_value ||
                data[i - width + 1] == high_value ||
                data[i - width - 1] == high_value ||
                data[i + width + 1] == high_value ||
                data[i + width - 1] == high_value)
            {
                temp[i] = high_value;
            }
        }
        else
        {
            temp[i] = 0;
        }
    }
    memcpy(data, temp, sizeof(unsigned char) * (width * height));
    free(temp);
}

void edge_detection(unsigned char **image, int width, int height)
{
    unsigned char *data = *image;

    greyscale(&data, width, height);
    int track_index = 0;
    int len = width * height * 4;
    unsigned char *red_array = calloc(width * height, sizeof(char));
    unsigned char *green_array = calloc(width * height, sizeof(char));
    unsigned char *blue_array = calloc(width * height, sizeof(char));

    // Separate into three channels
    for (int i = 0; i < len; i++)
    {
        switch (track_index)
        {
        case 0:
            red_array[(int)(i / 4)] = data[i];
            track_index += 1;
            break;
        case 1:
            green_array[(int)(i / 4)] = data[i];
            track_index += 1;
            break;
        case 2:
            blue_array[(int)(i / 4)] = data[i];
            track_index += 1;
            break;
        case 3:
            track_index = 0;
            break;
        }
    }

    box_blur_single_channel(&red_array, width, height);
    box_blur_single_channel(&green_array, width, height);
    box_blur_single_channel(&blue_array, width, height);

    struct sobel_data red_sobel_data = sobel_convolution(&red_array, width, height);
    struct sobel_data green_sobel_data = sobel_convolution(&green_array, width, height);
    struct sobel_data blue_sobel_data = sobel_convolution(&blue_array, width, height);

    unsigned char *red_nms = non_maximum_supression(&red_sobel_data, width, height);
    unsigned char *green_nms = non_maximum_supression(&green_sobel_data, width, height);
    unsigned char *blue_nms = non_maximum_supression(&blue_sobel_data, width, height);

    double_threshold(&red_nms, width, height);
    double_threshold(&green_nms, width, height);
    double_threshold(&blue_nms, width, height);

    hysteresis_edge_tracking(&red_nms, width, height);
    hysteresis_edge_tracking(&green_nms, width, height);
    hysteresis_edge_tracking(&blue_nms, width, height);

    // combine into one array
    for (int j = 0; j < len; j += 4)
    {
        data[j] = red_nms[(int)(j / 4)];
        data[j + 1] = green_nms[(int)(j / 4)];
        data[j + 2] = blue_nms[(int)(j / 4)];
    }

    cleanup_sobel_data(&red_sobel_data);
    cleanup_sobel_data(&green_sobel_data);
    cleanup_sobel_data(&blue_sobel_data);

    free(red_nms);
    free(green_nms);
    free(blue_nms);

    free(red_array);
    free(blue_array);
    free(green_array);
}

int main()
{
    unsigned error;
    unsigned char *image = 0;
    unsigned width, height;
    clock_t begin = clock();
    error = lodepng_decode32_file(&image, &width, &height, filename_in);
    printf("png decode: %lfms \n", ((double)(clock() - begin) / CLOCKS_PER_SEC) * 1000.0);

    begin = clock();
    edge_detection(&image, width, height);
    printf("Edge Detection: %lfms \n", ((double)(clock() - begin) / CLOCKS_PER_SEC) * 1000.0);

    begin = clock();
    unsigned write_error = lodepng_encode32_file(filename_out, image, width, height);
    printf("png encode: %lfms \n", ((double)(clock() - begin) / CLOCKS_PER_SEC) * 1000.0);

    free(image);
}
