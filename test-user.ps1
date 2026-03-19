# PowerShell script to create test user
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    "name" = "Test User"
    "email" = "test@example.com"
    "password" = "password123"
    "role" = "Admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers $headers -Body $body
    $response.Content | ConvertFrom-Json
    Write-Host "User created: $($response.name)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
