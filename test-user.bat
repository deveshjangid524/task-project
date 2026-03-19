@echo off
echo Creating test user...
curl -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"Admin\"}" http://localhost:5000/api/auth/register
echo.
echo Test user creation completed.
pause
