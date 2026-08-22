# AmakusaPokeDEX
あまくさPokeDEX

- トップページ: https://v-musiclist.github.io/AmakusaPokeDEX/
- FRLG図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/FRLG/
- SWSH図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/SWSH/
- SV図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/SV/
- BDSP図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/BDSP/
- PLA図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/PLA/
- LGPE図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/LGPE/
- 全国図鑑: https://v-musiclist.github.io/AmakusaPokeDEX/NATIONAL/
- 小文字URL: `/frlg/` または `/FRLG/`、`/za/` または `/ZA/`、`/swsh/` または `/SWSH/`、`/sv/` または `/SV/`、`/bdsp/` または `/BDSP/`、`/pla/` または `/PLA/`、`/lgpe/` または `/LGPE/`、`/national/` または `/NATIONAL/`

ZA図鑑はスプレッドシートの「ミアレ」「異次元」「メガシンカ」シートを読み込みます。
SWSH図鑑はスプレッドシートの「ガラル」「ヨロイ島」「カンムリ雪原」シートを読み込みます。
SV図鑑はスプレッドシートの「パルデア」「キタカミ」「ブルーベリー」シートを読み込みます。
BDSP図鑑はスプレッドシートの「BDSP」シートを読み込みます。
PLA図鑑はスプレッドシートの「ヒスイ」シートを読み込みます。
LGPE図鑑はスプレッドシートの「ピカブイ」シートを読み込みます。
全国図鑑はスプレッドシートの「NATIONAL」シートを読み込み、特殊情報に「メガシンカ」を含むポケモンを除外します。

SWSH図鑑は `http://localhost:8000/SWSH/` で確認できます。
SV図鑑は `http://localhost:8000/SV/` で確認できます。
BDSP図鑑は `http://localhost:8000/BDSP/` で確認できます。
PLA図鑑は `http://localhost:8000/PLA/` で確認できます。
LGPE図鑑は `http://localhost:8000/LGPE/` で確認できます。
# ローカルサーバー立て方
python -m http.server 8000

トップページは `http://localhost:8000/`
FRLG図鑑は `http://localhost:8000/FRLG/`
ZA図鑑は `http://localhost:8000/ZA/` で確認できます。
全国図鑑は `http://localhost:8000/NATIONAL/` で確認できます。