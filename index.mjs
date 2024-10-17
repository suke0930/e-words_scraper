import { existsSync, readFileSync, writeFileSync } from 'fs';
import { datahandler } from './lib/datahandler.mjs';
import { csvmanager } from './lib/csvperser.mjs';
const limit = 5;
const jsonpath = "./logs/list.json";
const listpath = "./取得リスト.txt";
/**
 * データを受け取ったあとの処理。実質メイン処理か？
 * @param data
 */
function aftersoil(rawdata) {
    const cli = new datahandler();
    //この時点で内容の取得は完了している-
    writeFileSync(jsonpath, JSON.stringify(rawdata));
    const data = cli.gotmoreinfo(rawdata);
    writeFileSync("./logs/debug.json", JSON.stringify(data));
    const tocsv = csvmanager.datatocsv(data);
    writeFileSync("./問題データ.csv", tocsv);
    console.log("書き込み完了");
    //この下にサーバー処理をexpressで書いてあとでいい感じにする
    process.exit();
}
/**
 * 初期化諸々を含めたデーターの用意に使用される関数
 */
async function main() {
    const cli = new datahandler();
    /**
     * 定義ファイルの参照
     */
    const rawlistdata = readFileSync(listpath, { encoding: "utf-8" });
    const listdata = rawlistdata.replace("\r", "").split("\n");
    //以下の処理は必要あるか判断 basenameを参照のこと
    if (existsSync(jsonpath)) {
        const loaddata = JSON.parse(String(readFileSync(jsonpath)));
        let baseflag = 1;
        loaddata.map((data) => {
            let flag = 1;
            listdata.map((data2) => {
                if (data2 === data.basename) {
                    flag = 0;
                }
            });
            if (flag === 1)
                baseflag = 0;
        });
        if (loaddata.length === 0) {
            baseflag = 0;
        }
        if (baseflag === 1) {
            //すべて一致の場合
            console.log("前回の処理結果と変わらないよ！\n今回はスクレイピングはしないよ！");
            console.log(listdata);
            aftersoil(loaddata);
        }
        else {
            //一致しない項目がある場合
            //一致しない項目の絞り出しはめんどい
            console.log(listdata);
            const URLS = cli.generateURLS(listdata); //URLに変換
            // console.log(URLS);
            cli.scrapeURLs(URLS, limit).then((rawdata) => {
                aftersoil(rawdata);
            });
        }
    }
    else {
        //初回起動
        console.log(listdata);
        const URLS = cli.generateURLS(listdata); //URLに変換
        // console.log(URLS);
        cli.scrapeURLs(URLS, limit).then((rawdata) => {
            const data = cli.gotmoreinfo(rawdata);
            aftersoil(rawdata);
        });
    }
}
main();
