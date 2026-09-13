param(
    [Parameter(Mandatory = $true)]
    [string]$SlidesDir,
    [string]$Output = "",
    [int]$SecondsPerSlide = 4
)

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Error "ffmpeg nie jest w PATH. Zainstaluj ffmpeg lub zmontuj rolkę ręcznie w CapCut."
    exit 1
}

if (-not (Test-Path $SlidesDir)) {
    Write-Error "Folder nie istnieje: $SlidesDir"
    exit 1
}

$slides = Get-ChildItem -Path $SlidesDir -Filter "*.png" | Sort-Object Name
if ($slides.Count -eq 0) {
    Write-Error "Brak plikow PNG w $SlidesDir"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Output)) {
    $Output = Join-Path (Split-Path $SlidesDir -Parent) "reel.mp4"
}

$tempDir = Join-Path $env:TEMP "reel-build-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    $listFile = Join-Path $tempDir "inputs.txt"
    $sb = New-Object System.Text.StringBuilder
    foreach ($slide in $slides) {
        [void]$sb.AppendLine("file '$($slide.FullName.Replace("'", "''"))'")
        [void]$sb.AppendLine("duration $SecondsPerSlide")
    }
    $last = $slides[-1].FullName.Replace("'", "''")
    [void]$sb.AppendLine("file '$last'")
    Set-Content -Path $listFile -Value $sb.ToString() -Encoding UTF8

    $scaled = Join-Path $tempDir "scaled.mp4"
    & ffmpeg -y -f concat -safe 0 -i $listFile `
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xFFF8F0" `
        -c:v libx264 -pix_fmt yuv420p -r 30 $scaled

    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Copy-Item $scaled $Output -Force
    Write-Host "Zapisano: $Output"
}
finally {
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}
