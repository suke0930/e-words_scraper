import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
/**
 * HTMLを落としてきたついでにフォーマットに合わせて出力するクラス
 */
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
     * タンゴからURLを引っ張り出す
     * @param ursstr 単語
     */
    generateURLS(ursstr) {
        const resolve = [];
        ursstr.map((ass) => {
            resolve.push("https://e-words.jp/w/" + ass + ".html");
        });
        return resolve;
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
            // console.log(results);
            // process.exit();
            if (this.browser) {
                this.browser.close();
            }
            else {
                console.log("おかしいよ！");
            }
            resolve(results);
        });
    }
    /**
     * 単一のリンクを基に、あらたにスクレイピングを行う
     * @param url スクレイピング先
     * @returns {ExtractedData} 帰ってきたデータ
     */
    async scrapeWebsite(url) {
        return new Promise(async (resolve) => {
            const whybuglog = "\n" + url + "を要求...";
            console.log(whybuglog);
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
                        if (document.querySelectorAll("body")[0].textContent === '\n404 Not Found.\n指定されたページは存在しません。\nトップページへ\n\n\n') {
                            console.log("404");
                            return -1;
                        }
                        const title = document.querySelector("#content > article > h1")?.textContent || '';
                        const summary = document.querySelector("#Summary > p")?.textContent || '';
                        return { title, summary };
                    });
                    const rawbasename = url.replace("https://e-words.jp/w/", "").replace(".html", "");
                    const basename = rawbasename.split("\r").join();
                    await page.close();
                    // 正常に抽出された場合、データを返す]
                    if (result !== -1) {
                        console.log(result.title + " を取得");
                        resolve({ basename: basename, code: 1, maindata: result });
                    }
                    else {
                        console.log("404やんけしね");
                        resolve({ basename: basename, code: -1, maindata: result });
                    }
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
    /**
     * 受け取ったデータから英文以外のもろもろを弾いたり、問題文を形成したり
     * @param data extractmen
     */
    gotmoreinfo(data) {
        /**
         * 英字以外削除
         * @param data
         * @returns
         */
        function removeengwords(data) {
            function removeBracketsContent(text) {
                return text.replace(/【[^】]+】/g, '').trim().split(" ");
            }
            let returndata = [];
            data.map((data2) => {
                const maindata = data2.maindata;
                if (maindata !== -1) {
                    const buffer = removeBracketsContent(maindata.title);
                    const buffer2 = buffer.filter((test2) => {
                        if (test2) {
                            return test2;
                        }
                    });
                    returndata.push({ basename: data2.basename, code: data2.code, maindata: data2.maindata, name: buffer2 });
                }
                else {
                    // console.log("-1だと？");
                    returndata.push({ basename: data2.basename, code: data2.code, maindata: data2.maindata, name: [] });
                }
                ;
            });
            return returndata;
        }
        /**
         * "とは"までを切り出し&問題文修正
         * @param data
         * @returns
         */
        function getinformation(data) {
            const returndata = [];
            data.map((data) => {
                let infor = "";
                const maindata = data.maindata;
                //クソコード注意
                if (maindata !== -1) {
                    let basedata = maindata.summary;
                    basedata = basedata.slice(basedata.indexOf("とは、") + 3);
                    data.name?.map((data4) => {
                        if (basedata.indexOf(data4) !== -1) {
                            basedata = basedata.replace(data4, "(\"答えの単語\")");
                        }
                    });
                    infor = basedata;
                }
                returndata.push({ basename: data.basename, code: data.code, maindata: data.maindata, name: data.name, information: infor });
            });
            return returndata;
        }
        //ここまでで英語以外を消し飛ばしたデーターが完成している
        const data1st = removeengwords(data);
        const data2st = getinformation(data1st);
        // console.log(data2st)
        return data2st;
    }
}
