# leaflet-color-cache-tile

#### Description
leaflet two-dimensional tiles acquire and dynamically change the overall color scheme, and add a continuous caching scheme to avoid repeated request processing


```
import 'leaflet-color-cache-tile'

L.colorCacheTile(
  `http://t{s}.tianditu.gov.cn/vec_w/wmts?xxxx`,
  {
    ...your default options,

    <!-- This method is used to adjust the rgb values on all images. pixel is the original rgb value of the image -->
    <!-- reference from https://github.com/hnrchrdl/leaflet-tilelayer-colorizr -->
    colorize(pixel) {
      pixel.r -= 232;
      pixel.g -= 214;
      pixel.b -= 167;
      return pixel;
    },
    <!-- cache name and cache time -->
    <!-- The name is used when multiple tiles are cached, such as a map with geographic information tiles and text information tiles -->
    cacheSet(cacheOptions) {
      cacheOptions.name = 'tile-vec';
      cacheOptions.time = false;
      return cacheOptions;
    }
  }
);
```
![1676946528195](/assets/1676946528195.jpg)
