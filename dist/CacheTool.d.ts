type CacheDataMap = Map<string, string>;
export default class CacheTile {
    private cacheMap;
    private time;
    private name;
    private overdue;
    /**
     *
     * @param {string} name 储存某一类的数据名称
     * @param {number | boolean} overdue 过期时间(s)/是否过期
     */
    constructor(name: string, overdue?: number | boolean);
    init(): Promise<CacheDataMap>;
    getTile(key: string): string | undefined;
    setTile(key: string, value: string, upload?: boolean): void;
    checkDatabase(): Promise<CacheDataMap | null>;
    updateDatabase(data?: CacheDataMap): Promise<void>;
    getCacheTime(): string | number;
}
export {};
