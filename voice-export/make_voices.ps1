# VOICEVOX を起動した状態で実行すると、voices.txt の声で各キャラのセリフ(<キャラ>.txt の各行)を
# out\<キャラ>\001.wav, 002.wav ... として作ります。途中で止めても、もう一度実行すれば続きから作ります。
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$engine = 'http://127.0.0.1:50021'
try { Invoke-RestMethod -Uri "$engine/version" | Out-Null } catch {
  Write-Host 'VOICEVOX が見つかりません。VOICEVOX を起動してから、もう一度実行してください。' -ForegroundColor Red; exit 1
}
$map = @{}
foreach ($l in Get-Content (Join-Path $here 'voices.txt') -Encoding UTF8) {
  if ($l -match '^\s*([a-z]+)\s*=\s*(\d+)\s*$') { $map[$Matches[1]] = [int]$Matches[2] }
}
foreach ($chara in $map.Keys) {
  $style = $map[$chara]
  $lines = @(Get-Content (Join-Path $here "$chara.txt") -Encoding UTF8)
  $out = Join-Path $here "out\$chara"
  New-Item -ItemType Directory -Force -Path $out | Out-Null
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $text = $lines[$i]; if (-not $text.Trim()) { continue }
    $file = Join-Path $out ('{0:D3}.wav' -f ($i + 1))
    if (Test-Path $file) { continue }
    # the query result is passed on byte for byte (no re-encoding of the Japanese text)
    $q = Invoke-WebRequest -Method Post -Uri ("$engine/audio_query?speaker=$style&text=" + [uri]::EscapeDataString($text)) -UseBasicParsing
    $body = $q.RawContentStream.ToArray()
    Invoke-WebRequest -Method Post -Uri "$engine/synthesis?speaker=$style" -Body $body -ContentType 'application/json' -OutFile $file -UseBasicParsing
    Write-Host ("{0}: {1}/{2}" -f $chara, ($i + 1), $lines.Count)
  }
}
Write-Host 'すべて作り終わりました。out フォルダを ZIP にして送ってください。' -ForegroundColor Green
