# leaflet-color-cache-tile

#### 介绍
leaflet二维瓦片获取并动态改变整体配色方案，并加入持续缓存方案来避免重复请求处理。

```
import 'leaflet-color-cache-tile'

L.colorCacheTile(
  `http://t{s}.tianditu.gov.cn/vec_w/wmts?xxxx`,
  {
    ...配置信息,

    <!-- 这个方法用来调整所有的图片上的rgb值，pixel是图片原有的rgb值 -->
    <!-- 借鉴 https://github.com/hnrchrdl/leaflet-tilelayer-colorizr -->
    colorize(pixel) {
      pixel.r -= 232;
      pixel.g -= 214;
      pixel.b -= 167;
      return pixel;
    },
    <!-- 缓存名称和时间 -->
    <!-- 名称在多组瓦片缓存时起作用，比如天地图存在地理信息瓦片和文字信息瓦片 -->
    cacheSet(cacheOptions) {
      cacheOptions.name = 'tile-vec';
      cacheOptions.time = false;
      return cacheOptions;
    }
  }
);
```

![1676946528195](/assets/1676946528195.jpg)
