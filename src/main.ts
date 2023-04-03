// @ts-nocheck
import CacheTile from './CacheTool';
import type { TileEvent, Coords, DoneCallback } from 'leaflet';

if (!L) {
  throw new Error('please install leaflet which >1.0.0 to use the plugins');
}

let _CacheTileObj: {[key: string]: CacheTile} = {};

const originalInitTile = L.GridLayer.prototype._initTile;
const originalInitialize = L.TileLayer.prototype.initialize;
const originalCreateTile = L.TileLayer.prototype.createTile;

const ColorCacheTile = L.TileLayer.extend({
  initialize(url: string, options: any) {
    options = L.extend(
      {},
      L.TileLayer.prototype.options,
      {
        // 必须是一个方法，才能保证多组不同数据传递均被接受，且不被覆盖
        colorize(pixel: object) {
          return pixel;
        },
        cacheSet(cacheOptions = {}) {
          return cacheOptions;
        },
        crossOrigin: 'Anonymous'
      },
      options
    );

    originalInitialize.call(this, url, options);

    L.setOptions(this, options);

    // 初始化缓存 -- 异步获取数据，本地数据库是异步操作
    const _cacheOptions = options.cacheSet({});
    const _colorizeName = _cacheOptions.name || CacheTile.name;
    const _colorizeTime = _cacheOptions.time;
    _CacheTileObj[_colorizeName] = new CacheTile(_colorizeName, _colorizeTime);

    this.setColorizr(options.colorize);
    this.setCacheOptions(options.cacheSet);

    this.on('tileload', (e: TileEvent) => {
      const coordsValues = Object.values(e.coords).join(':');
      this._colorize(e.tile, `${_colorizeName}/${coordsValues}`);
    });
  },
  setColorizr(colorizrFactory: Function | undefined) {
    if (!colorizrFactory || typeof colorizrFactory !== 'function') {
      // eslint-disable-next-line max-len
      throw `The colorize option should be a function and return an object with at least one of "r", "g", "b", or "a" properties. Got:${typeof colorizrFactory}`;
    } else {
      this.options.colorize = colorizrFactory;
    }
    this.redraw(false);
  },
  setCacheOptions(cacheOptionsFunc: Function | undefined) {
    if (!cacheOptionsFunc || typeof cacheOptionsFunc !== 'function') {
      // eslint-disable-next-line max-len
      throw `The cacheSet option should be a function and return an object with at least one of "name", "time" properties. Got:${typeof cacheOptionsFunc}`;
    } else {
      this.options.cacheSet = cacheOptionsFunc;
    }
    this.redraw(false);
  },
  _initTile(tile: HTMLImageElement) {
    originalInitTile.call(this, tile);

    const tileSize = this.getTileSize();

    tile.style.width = `${tileSize.x + 1}px`;
    tile.style.height = `${tileSize.y + 1}px`;
  },
  createTile(coords: Coords, done: DoneCallback) {
    const tile = originalCreateTile.call(this, coords, done);

    tile.crossOrigin = 'Anonymous';
    // tile.src = this.getTileUrl(coords);

    const coordsValues = Object.values(coords).join(':');
    const _colorizeName = this.options.cacheSet({}).name || CacheTile.name;
    const tileCacheName = `${_colorizeName}/${coordsValues}`;
    const catchBaseImg = _CacheTileObj[_colorizeName].getTile(tileCacheName);
    // 异步处理数据
    if (!catchBaseImg) {
      tile.hidden = true;
      // 默认直接请求加载，避免重复初始化缓存数据导致加载阻塞
      tile.src = this.getTileUrl(coords);
      _CacheTileObj[_colorizeName].init().then((v) => {
        if (v.size) {
          const _catchBaseImg = _CacheTileObj[_colorizeName].getTile(tileCacheName);
          if (_catchBaseImg) {
            tile.src = _catchBaseImg;
            tile.setAttribute('color-cache-loaded', 'true');
          }
        }
        done(undefined, tile);
      });
    } else {
      tile.src = catchBaseImg;
      tile.setAttribute('color-cache-loaded', 'true');
    }
    return tile;
  },
  _colorize(tileImage: HTMLImageElement, coordsName: string) {
    if (tileImage.getAttribute('color-cache-loaded')) {
      tileImage.hidden = false;
      return;
    } else {
      tileImage.hidden = true;
    }
    let _tileImage = tileImage;
    let newTileImage = new Image();
    newTileImage.crossOrigin = 'Anonymous';
    newTileImage.src = _tileImage.src;
    newTileImage.onload = () => {
      let canvas = document.createElement('canvas');

      canvas.width = newTileImage.width;
      canvas.height = newTileImage.height;

      let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      ctx.drawImage(newTileImage, 0, 0);

      let imageData: ImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let pix = imageData.data;

      for (let i = 0, n = pix.length; i < n; i += 4) {
        let pixel = this.options.colorize({
          r: pix[i],
          g: pix[i + 1],
          b: pix[i + 2],
          a: pix[i + 3]
        });
        if (
          !pixel ||
          pixel !== Object(pixel) ||
          Object.prototype.toString.call(pixel) === '[object Array]'
        ) {
          if (i === 0) {
            // eslint-disable-next-line max-len
            throw 'The colorize option should return an object with at least one of "r", "g", "b", or "a" properties.';
          }
        } else {
          if (pixel.hasOwnProperty('r') && typeof pixel.r === 'number') {
            pix[i] = pixel.r;
          }
          if (pixel.hasOwnProperty('g')) {
            pix[i + 1] = pixel.g;
          }
          if (pixel.hasOwnProperty('b')) {
            pix[i + 2] = pixel.b;
          }
          if (pixel.hasOwnProperty('a')) {
            pix[i + 3] = pixel.a;
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      _tileImage.setAttribute('color-cache-loaded', 'true');
      const _src = canvas.toDataURL('image/webp', 0.8);

      _tileImage.src = _src;

      const _colorizeName = this.options.cacheSet({}).name || CacheTile.name;
      _CacheTileObj[_colorizeName].setTile(coordsName, _src);
    };
  }
});

// @ts-ignore
L.colorCacheTile = function (url: string, options) {
  // @ts-ignore
  return new ColorCacheTile(url, options);
}

export default ColorCacheTile;
