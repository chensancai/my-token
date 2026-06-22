# Simple HTTP server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8765/")
$listener.Start()
Write-Host "Server running at http://localhost:8765/"
Write-Host "Serving files from: $(Get-Location)"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $url = $request.Url.LocalPath

    if ($url -eq "/") { $url = "/index.html" }

    $filePath = Join-Path (Get-Location) $url.TrimStart("/")
    Write-Host "GET $url -> $filePath"

    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        switch ($ext) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".css"  { $response.ContentType = "text/css; charset=utf-8" }
            ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
            default { $response.ContentType = "application/octet-stream" }
        }
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $response.ContentLength64 = $msg.Length
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $response.Close()
}
$listener.Close()
