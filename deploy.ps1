param([string]$msg = "update")
git add .
git commit -m $msg
git push origin main
Invoke-WebRequest -Method POST -Uri "https://api.vercel.com/v1/integrations/deploy/prj_BcuZ7fHGiWK1n59zkPqqKqPLujiR/tqnuOWDyuj"
Write-Host "Deploy triggered. Check status at vercel.com dashboard."
