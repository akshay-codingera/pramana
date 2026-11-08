# scripts/download_missing_archives.ps1
# PRAMANA: Download remaining missing archives to achieve 100% completeness (77/77 years)

$WORKSPACE = "D:\Projects\pramana"
$ENG_DIR = Join-Path $WORKSPACE "data\source\english_archives"
$MANIFEST_PATH = Join-Path $WORKSPACE "data\source\download_manifest.csv"
$INVENTORY_PATH = Join-Path $WORKSPACE "result\dataset_audit\s3_tar_inventory_parsed.csv"

# Load expected sizes
$expectedSizes = @{}
if (Test-Path $INVENTORY_PATH) {
    $csv = Import-Csv $INVENTORY_PATH
    foreach ($row in $csv) {
        if ($row.type -eq "english_tar") {
            $expectedSizes[$row.year] = [int64]$row.size_bytes
        }
    }
}

$missingYears = @(1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1991, 1992, 1993, 1994, 1995, 2004)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "DOWNLOADING REMAINING MISSING ARCHIVES ($($missingYears.Count) years)" -ForegroundColor Cyan
Write-Host "Years: $($missingYears -join ', ')" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

foreach ($y in $missingYears) {
    # Check disk space threshold
    $dDrive = Get-PSDrive -Name "D"
    $freeGB = [math]::Round($dDrive.Free / 1GB, 2)
    if ($freeGB -lt 15.0) {
        Write-Host "[STORAGE SAFETY HALT] Free disk space on Drive D: is down to $freeGB GB! Halting." -ForegroundColor Red
        exit 1
    }

    $expSize = if ($expectedSizes.ContainsKey("$y")) { $expectedSizes["$y"] } else { 0 }
    $s3Tar = "s3://indian-supreme-court-judgments/data/tar/year=$y/english/english.tar"
    $localTar = Join-Path $ENG_DIR "year=$y\english.tar"
    $parentDir = Split-Path -Parent $localTar
    if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }

    # Check if already present
    if (Test-Path $localTar) {
        $actualSize = (Get-Item $localTar).Length
        if ($expSize -gt 0 -and $actualSize -eq $expSize) {
            Write-Host "[SKIP - COMPLETED] english_year=$y.tar" -ForegroundColor Green
            continue
        }
    }

    $retries = 3
    $success = $false
    for ($attempt = 1; $attempt -le $retries; $attempt++) {
        Write-Host "[DOWNLOADING ($attempt/$retries)] english_year=$y.tar..." -ForegroundColor White
        $startTime = Get-Date
        & aws s3 cp $s3Tar $localTar --no-sign-request

        if ($LASTEXITCODE -eq 0 -and (Test-Path $localTar)) {
            $downloadedSize = (Get-Item $localTar).Length
            if ($expSize -gt 0 -and $downloadedSize -ne $expSize) {
                Write-Host "[SIZE MISMATCH] Expected: $expSize, Got: $downloadedSize. Retrying..." -ForegroundColor Red
                Remove-Item $localTar -Force -ErrorAction SilentlyContinue
            } else {
                $duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
                $speed = if ($duration -gt 0) { [math]::Round(($downloadedSize/1MB)/$duration, 2) } else { 0 }
                Write-Host "[SUCCESS] english_year=$y.tar ($([math]::Round($downloadedSize/1MB, 2)) MB in ${duration}s, ${speed} MB/s)" -ForegroundColor Green
                $success = $true
                $logLine = "$y,english_year=$y.tar,english_tar,$s3Tar,$localTar,$expSize,$downloadedSize,COMPLETED,$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
                Add-Content -Path $MANIFEST_PATH -Value $logLine
                break
            }
        } else {
            Write-Host "[FAILED ATTEMPT $attempt] Error downloading $s3Tar. Retrying in 3s..." -ForegroundColor Red
            Start-Sleep -Seconds 3
        }
    }

    if (-not $success) {
        Write-Host "[ERROR] Failed to download english_year=$y.tar after $retries attempts!" -ForegroundColor Red
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "MISSING ARCHIVES RECOVERY PROCESS COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
