import { del, get, set } from 'idb-keyval';

type CacheDataMap = Map<string, string>;

export default class CacheTile {
  private cacheMap: CacheDataMap = new Map();

  // private time = Math.floor(new Date().valueOf() / 1000)
  private time = Math.floor(new Date().valueOf() / 1000);

  private name = 'cache_tile_name';

  private overdue: number | boolean | undefined;

  /**
   *
   * @param {string} name 储存某一类的数据名称
   * @param {number | boolean} overdue 过期时间(s)/是否过期
   */
  constructor(name: string, overdue?: number | boolean) {
    if (name) {
      this.name = name;
    }
    this.overdue = overdue;

    this.init();
  }
  // 初始化
  async init(): Promise<CacheDataMap> {
    const data = await this.checkDatabase();
    if (data) {
      this.cacheMap = data;
    }
    return Promise.resolve(this.cacheMap);
  }
  // 通过key获取map数据
  getTile(key: string): string | undefined {
    return this.cacheMap.get(key);
  }
  // 设置map数据
  setTile(key: string, value: string, upload = false):void {
    const { cacheMap } = this;
    if (upload) {
      cacheMap.set(key, value);
    } else {
      if (!cacheMap.has(key)) {
        cacheMap.set(key, value);
      }
    }

    this.updateDatabase();
  }
  // 检查并获取数据
  async checkDatabase(): Promise<CacheDataMap | null> {
    const data = await get(this.name);
    const _time = new Date().valueOf() / 1000;
    if (data) {
      if (data.time === 'NO' || data.time > _time) {
        return data.data;
      }
      del(this.name);
      return null;
    }
    return null;
  }
  // 更新数据
  async updateDatabase(data = this.cacheMap): Promise<void> {
    const { name } = this;
    await set(name, {
      data,
      time: this.getCacheTime()
    });
  }
  // 时间过期机制
  // 在下一次初始化时，判断是否过期，来决定是否延用/清除数据
  getCacheTime(): string | number {
    const { time, overdue } = this;
    // 0  false -- 不过期
    if (!overdue || (typeof overdue === 'number' && overdue < 0)) {
      return 'NO';
    } else {
      return +time + +overdue;
    }
  }
}
