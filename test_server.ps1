$r = Invoke-WebRequest -Uri 'http://localhost:8765/remembrance.html' -UseBasicParsing -TimeoutSec 5
Write-Host "Status: $($r.StatusCode)"
Write-Host "Length: $($r.Content.Length)"
