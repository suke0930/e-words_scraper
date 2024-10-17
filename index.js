import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
export class datahandler {
    constructor() {
        this.browser = null; //dummy
    }
    ;
    /**
     * ブラウザの初期化
     * @returns 起動時のpromice
     */
    async initbrowther() {
        return new Promise(async (resolve) => {
            if (!this.browser)
                await this.initbrowther();
            try {
                this.browser = await puppeteer.launch({
                    headless: 'shell', // ヘッドレスモードを有効にし、UIを表示しない
                });
                resolve();
            }
            catch (error) {
                console.log(error);
                console.log("ブラウザの初期化に失敗");
                process.exit();
            }
        });
    }
    /**
     * 複数のURLのリストを配列で受取り、並列実行する。
     * 実行数はpromiseで監視する。
     * @param urls URLS
     * @param limit 同時にスクレイピングする最大インスタンス数
     * @returns
     */
    async scrapeURLs(urls, lim) {
        return new Promise(async (resolve) => {
            //渡されたURLSを基に、promice allとPlimitで引っ掛けまくる
            const limit = pLimit(lim);
            const tasks = [];
            urls.map((inv) => {
                tasks.push(limit(() => this.scrapeWebsite(inv)));
            });
            const results = await Promise.all(tasks); // 全ての関数が終わるのを待つ
            console.log(results);
            process.exit();
        });
    }
    /**
     * 単一のリンクを基に、あらたにスクレイピングを行う
     * @param url スクレイピング先
     * @returns {ExtractedData} 帰ってきたデータ
     */
    async scrapeWebsite(url) {
        return new Promise(async (resolve) => {
            if (!this.browser)
                await this.initbrowther();
            if (this.browser) {
                const page = await this.browser.newPage();
                try {
                    // JavaScriptを有効にし、リダイレクトを無制限に許可
                    await page.setJavaScriptEnabled(true);
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    // 必要な要素を抽出
                    const result = await page.evaluate(() => {
                        const title = document.querySelector("#content > article > h1")?.textContent || '';
                        const summary = document.querySelector("#Summary > p")?.textContent || '';
                        return { title, summary };
                    });
                    await page.close();
                    // 正常に抽出された場合、データを返す
                    resolve(result);
                }
                catch (error) {
                    await page.close();
                    console.log("エラーだよ！");
                    // 失敗時には -1 を返す
                    return -1;
                }
            }
            else {
                console.log("何このえらー\nブラウザないんだけど");
                process.exit();
            }
        });
    }
}
// 使用例
const cli = new datahandler();
cli.scrapeURLs(['https://e-words.jp/w/DDoS.html', "https://e-words.jp/w/%E6%B5%AE%E5%8B%95%E5%B0%8F%E6%95%B0%E7%82%B9%E6%95%B0.html"], 3).then((data) => {
    console.log(data);
});
