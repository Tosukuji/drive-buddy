#!/bin/bash
# Mac 用:VOICEVOX を起動した状態でダブルクリックすると、voices.txt の声で各キャラのセリフを
# out/<キャラ>/001.wav, 002.wav ... として作ります。途中で止めても、もう一度実行すれば続きから作ります。
cd "$(dirname "$0")" || exit 1
E=http://127.0.0.1:50021
if ! curl -sf "$E/version" > /dev/null; then echo "VOICEVOX が見つかりません。VOICEVOX を起動してから、もう一度実行してください。"; read -r -p "Enter で閉じます"; exit 1; fi
grep -E '^[a-z]+=[0-9]+' voices.txt | while IFS='=' read -r chara style; do
  mkdir -p "out/$chara"; n=0; total=$(wc -l < "$chara.txt" | tr -d ' ')
  while IFS= read -r text || [ -n "$text" ]; do
    n=$((n + 1)); [ -z "$text" ] && continue
    f=$(printf 'out/%s/%03d.wav' "$chara" "$n"); [ -f "$f" ] && continue
    curl -sf -X POST -G --data-urlencode "text=$text" --data "speaker=$style" "$E/audio_query" \
      | curl -sf -X POST -H 'Content-Type: application/json' --data-binary @- "$E/synthesis?speaker=$style" -o "$f"
    echo "$chara: $n/$total"
  done < "$chara.txt"
done
echo "すべて作り終わりました。out フォルダを ZIP にして送ってください。"; read -r -p "Enter で閉じます"
