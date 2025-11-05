# DataForEarth Harvester Runner (Windows)
# This script triggers the backend automation loop continuously.
# Usage: Right-click > Run with PowerShell (or run in an elevated PowerShell)

# Configuration
$BackendUrl = "https://fszghwwbvxwkmgfvhzrh.supabase.co"  # Backend endpoint
$AnonKey    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzemdod3didnh3a21nZnZoenJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzgxNzksImV4cCI6MjA3NjcxNDE3OX0.o8EtEOaKmfqLSRNTJKXtJITmmT2hgekT9CBjCfojXeM"
$IntervalSeconds = 120  # 2 minutes

# Optional: customize headers once
$Headers = @{
  "Authorization" = "Bearer $AnonKey"
  "apikey"        = $AnonKey
  "Content-Type"  = "application/json"
}

function Invoke-RunAutomation {
  try {
    $url = "$BackendUrl/functions/v1/run-automation"
    $body = "{}"
    $response = Invoke-WebRequest -Method POST -Uri $url -Headers $Headers -Body $body -UseBasicParsing -TimeoutSec 60
    $status = $response.StatusCode
    Write-Host "[$(Get-Date -Format o)] Automation tick -> HTTP $status"
  }
  catch {
    Write-Warning "[$(Get-Date -Format o)] Automation tick failed: $($_.Exception.Message)"
  }
}

Write-Host "Starting Data Harvester runner... Press Ctrl+C to stop."
while ($true) {
  Invoke-RunAutomation
  Start-Sleep -Seconds $IntervalSeconds
}
