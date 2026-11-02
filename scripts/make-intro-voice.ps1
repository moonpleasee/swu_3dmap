param(
  [Parameter(Mandatory=$true)][string]$InputPath,
  [Parameter(Mandatory=$true)][string]$OutputDir
)

Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$lines = Get-Content -LiteralPath $InputPath -Raw -Encoding UTF8 | ConvertFrom-Json
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Huihui Desktop')
$speaker.Rate = 1
try {
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $path = Join-Path $OutputDir ("{0:D2}.wav" -f ($i + 1))
    $speaker.SetOutputToWaveFile($path)
    $speaker.Speak([string]$lines[$i])
    $speaker.SetOutputToNull()
    Write-Output $path
  }
} finally {
  $speaker.Dispose()
}
