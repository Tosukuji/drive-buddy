# drive-buddy — ドライブ相棒(試作版)

My drive car app with claude

キャラクターが運転の前後に付き添い、運転中は声で案内してくれるスマホ向けアプリの試作です。

- 出発前チェック、運転中の休憩リマインド、到着時のねぎらいと記録
- キャラ4種(後輩・クールなお姉さん・元気な同級生・おっとり癒し系)
- 日本語・中国語・韓国語・英語の切り替え
- SA・PA・道の駅の案内(現在はデモ走行のみ・サンプル情報)

> 試作版です。運転中は画面を操作しないでください。

## フォルダ
| 場所 | 中身 |
|---|---|
| `web/src/app.html` | アプリ本体(画面・動き) |
| `web/src/personas/` | キャラごとのセリフ(4言語) |
| `web/src/i18n.json` | 画面の文言(4言語) |
| `docs/` | 公開用に組み立てたサイト(GitHub Pages で配信) |
| `dev/` | 組み立て・確認用のスクリプト |

## 組み立て方
```
cd dev
npm install
node build.mjs
```
`docs/` に公開用のファイルが出力されます。

## 素材・ライブラリ
- 3Dモデル:VRM1_Constraint_Twist_Sample © 2022 pixiv Inc.
  (VRM Public License 1.0。商用利用・改変・再配布可。入手元:[vrm-c/vrm-specification](https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample))
  スマホ向けにテクスチャを縮小しています。
- [three.js](https://threejs.org/)(MIT License)
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)(MIT License)
