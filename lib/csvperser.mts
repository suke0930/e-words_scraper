import { ExtractedData } from "./datahandler.mjs";

export class csvmanager {
    static datatocsv(data2: ExtractedData[]) {
        /**
         * 開業するだえ
         * @param data 
         * @returns 
         */
        function autokaigyou(data: ExtractedData[]): ExtractedData[] {
            let resolve: ExtractedData[] = [];

            data.map((data2) => {
                const maindata = data2.maindata;
                if (maindata !== -1) {
                    const newsemer = maindata.summary.split("。").join("。&lt;br>");
                    // replace("。", "。&lt;br>");
                    const newinfor = data2.information?.split("。").join("。&lt;br>");
                    resolve.push({ basename: data2.basename, code: data2.code, maindata: { title: maindata.title, summary: newsemer }, information: newinfor, name: data2.name });
                };
            })
            return resolve;
        }

        const data = autokaigyou(data2);
        let resolve = "タイトル,あとできちんとタイトル入力してね\n";//返すデーター

        data.map((data2) => {
            console.log("unko:", data2.name);
            if (data2.name?.length === 0 || data2.name === undefined) {
                console.log(data2)
                const basename2 = data2.basename.split("\r").join("");
                resolve += "記述,【取得エラー】" + basename2 + ",error";//問題文を定義
            } else {
                const maindata = data2.maindata;
                if (maindata !== -1) {
                    resolve += "記述," + data2.information + ",";//問題文を定義
                    if (data2.name) {
                        resolve += data2.name[0] + "\n";
                        resolve += "解説," + maindata.summary + "\n";//説明文を定義
                        //別解
                        if (data2.name.length > 1) {
                            resolve += "別解";//別解を定義
                            // console.log(data2.name);

                            data2.name.map((data4, num) => {
                                if (num !== 0) {
                                    resolve += "," + data4
                                }
                            })
                        }
                    }
                } else {
                    resolve += "記述," + data2.basename + "&lt;br>,";//問題文を定義
                    resolve += "取得エラーだよ！" + "\n";
                }

            };
            resolve += "\n\n";
        })
        return resolve;
    }
}
