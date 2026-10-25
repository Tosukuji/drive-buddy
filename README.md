# drive-buddy — ドライブ相棒(試作版)

My drive car app with claude

キャラクターが運転の前後に付き添い、運転中は声で案内してくれるスマホ向けアプリの試作です。

- 出発前チェック、運転中の休憩リマインド、到着時のねぎらいと記録
- キャラ5人(後輩・クールなお姉さん・元気な同級生・おっとり癒し系・年下の男の子)
- 休憩するとご当地のおみやげ → キャラに渡すとなかよし度が上下
- 図鑑(セリフ・おみやげ・都道府県・実績)、記念写真、今週のまとめ
- 雨の演出(傘・ワイパー)、拡大縮小、吹き出しの濃さ、画面の色
- VRMの読み込み・保存、モーション(VRMA)の読み込み
- SA・PA・道の駅の案内(デモ走行は見本の情報、実際の運転は OpenStreetMap の地図データで試験的に)
- 日本語・中国語・韓国語・英語の切り替え

変更点は [CHANGELOG.md](CHANGELOG.md) にまとめています。

> 試作版です。運転中は画面を操作しないでください。

## フォルダ
| 場所 | 中身 |
|---|---|
| `web/src/app.html` | アプリ本体(画面・動き) |
| `web/src/personas/` | キャラごとのセリフ(4言語) |
| `web/src/items.json` | おみやげ(47都道府県・どこでも・レア) |
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
- サンプルアバターA・B・C(AvatarSample_A/B/C)© pixiv Inc. VRoid Project
  (ファイル内の利用条件:誰でも利用可・法人/個人の商用利用可・改変可・再配布可・クレジット不要)
  スマホ向けにテクスチャと表情データを軽量化しています。
- [three.js](https://threejs.org/)(MIT License)
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)、@pixiv/three-vrm-animation(MIT License)
- 地図データ © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors(ODbL)
- 天気 [Open-Meteo.com](https://open-meteo.com/)(CC BY 4.0)
