Write-Host "Deploying TimberTrack..."

git pull origin main

docker run --rm -v ${PWD}:/app -w /app node:20 sh -c "npm install && npm run build"

docker exec forest-monitor-app composer install --no-interaction --prefer-dist --optimize-autoloader

docker exec forest-monitor-app php artisan migrate --force

docker exec forest-monitor-app php artisan optimize:clear
docker exec forest-monitor-app php artisan optimize

Write-Host "Deploy complete!"
