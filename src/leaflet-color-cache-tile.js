/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
/*
 * L.TileLayer.ColorCacheTile is a regular tilelayer with mapped colors.
 */
import CacheTile from './CacheTool';
(function () {
  // L.TileLayer.Colorizr =
  let _CacheTile = null;
  let ColorCacheTile = L.TileLayer.extend({
    initialize(url, options) {
      options = L.extend(
        {},
        L.TileLayer.prototype.options,
        {
          colorize(pixel) {
            return pixel;
          },
          crossOrigin: 'Anonymous'
        },
        options
      );
      // 初始化缓存 -- 异步获取数据，本地数据库是异步操作
      _CacheTile = new CacheTile(options.colorizeName, options.colorizeTime);

      L.TileLayer.prototype.initialize.call(this, url, options);

      L.setOptions(this, options);

      this.setColorizr(this.options.colorize);

      this.on('tileload', function (e) {
        const coordsValues = Object.values(e.coords).join(':');
        this._colorize(e.tile, coordsValues);
      });
    },
    setColorizr(colorizrFactory) {
      if (!colorizrFactory || typeof colorizrFactory !== 'function') {
        // eslint-disable-next-line max-len
        throw `The colorize option should be a function and return an object with at least one of "r", "g", "b", or "a" properties. Got:${typeof colorizrFactory}`;
      } else {
        this.options.colorize = colorizrFactory;
      }
      this.redraw(false);
    },
    createTile(coords, done) {
      const tile = document.createElement('img');

      L.DomEvent.on(tile, 'load', this._tileOnLoad.bind(this, done, tile));
      L.DomEvent.on(tile, 'error', this._tileOnError.bind(this, done, tile));

      if (this.options.crossOrigin || this.options.crossOrigin === '') {
        tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
      }

      // for this new option we follow the documented behavior
      // more closely by only setting the property when string
      if (typeof this.options.referrerPolicy === 'string') {
        tile.referrerPolicy = this.options.referrerPolicy;
      }
      tile.alt = '';
      tile.crossOrigin = 'Anonymous';

      const coordsValues = Object.values(coords).join(':');

      const catchBaseImg = _CacheTile.getTile(coordsValues);

      // 异步处理数据
      if (!catchBaseImg) {
        tile.hidden = true;
        tile.src = '';
        _CacheTile.init().then(v => {
          tile.src = this.getTileUrl(coords);
          if (v.size) {
            const _catchBaseImg = _CacheTile.getTile(coordsValues);
            if (_catchBaseImg) {
              tile.src = _catchBaseImg;
              tile.setAttribute('data-colorized', true);
            }
          }
          done(null, tile);
        });
      } else {
        tile.src = catchBaseImg;
        tile.setAttribute('data-colorized', true);
      }
      return tile;
    },
    _colorize(img, coordsValues) {
      if (img.getAttribute('data-colorized')) {
        img.hidden = false;
        return;
      } else {
        img.hidden = true;
      }
      let _img = img;
      let newImg = new Image();
      newImg.crossOrigin = 'Anonymous';
      newImg.src = _img.src;
      let _this = this;
      newImg.onload = function () {
        let canvas = document.createElement('canvas');
        canvas.width = newImg.width;
        canvas.height = newImg.height;
        let ctx = canvas.getContext('2d');
        if (!ctx) {
          return false;
        }
        ctx.drawImage(newImg, 0, 0);
        let imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let pix = imgd.data;
        for (let i = 0, n = pix.length; i < n; i += 4) {
          let pixel = _this.options.colorize({
            r: pix[i],
            g: pix[i + 1],
            b: pix[i + 2],
            a: pix[i + 3]
          });
          if (!pixel || pixel !== Object(pixel) || Object.prototype.toString.call(pixel) === '[object Array]') {
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
        ctx.putImageData(imgd, 0, 0);
        _img.setAttribute('data-colorized', true);
        const _src = canvas.toDataURL('image/webp', 0.8);
        // const compressSrc = LZString.compress(_src);
        // console.log(compressSrc);
        _img.src = _src;

        _CacheTile.setTile(coordsValues, _src);
      };
    }
  });
  (function (factory, window) {
    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
      define(['leaflet'], factory);
      // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
      module.exports = factory(require('leaflet'));
    }
    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
      window.L.tileLayer.colorCacheTile = factory(L);
    }
    // eslint-disable-next-line no-unused-vars
  })(L => {
    return function (url, options) {
      return new ColorCacheTile(url, options);
    };
  }, window);
})();
