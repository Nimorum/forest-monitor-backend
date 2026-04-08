<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NodeController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\AlarmController;
use App\Http\Controllers\NodeGroupController;

/*
|--------------------------------------------------------------------------
| ROTAS PÚBLICAS (Não precisam de Token)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/map-data', [MapController::class, 'getMapData']);
Route::get('/nodes-history', [MapController::class, 'getNodesHistoryAtTime']);
Route::get('/nodes/{id}/telemetry', [TelemetryController::class, 'getTelemetryHistory']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);


/*
|--------------------------------------------------------------------------
| ZONA DO DASHBOARD (Apenas o token do Administrador pode entrar)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'ability:dashboard'])->group(function () {

    Route::post('/node-groups', [NodeGroupController::class, 'store']);
    Route::delete('/node-groups/{nodeGroup}', [NodeGroupController::class, 'destroy']);
    Route::post('/node-groups/{nodeGroup}/nodes', [NodeGroupController::class, 'assignNodes']);
    Route::get('/node-groups', [NodeGroupController::class, 'index']);

    Route::post('/create-gateway-token', [AuthController::class, 'createGatewayToken']);
    Route::get('/tokens', [AuthController::class, 'listGatewayTokens']);
    Route::delete('/tokens/{tokenId}', [AuthController::class, 'revokeGatewayToken']);

    Route::get('/alarms', [AlarmController::class, 'checkAndGetAlarms']);
    Route::patch('/alarms/{id}/resolve', [AlarmController::class, 'resolveAlarm']);

    Route::get('/my-nodes', [NodeController::class, 'getMyNodes']);
    Route::patch('/nodes/bulk-visibility', [NodeController::class, 'updateBulkVisibility']);
    Route::get('/nodes/{node}/groups', [NodeController::class, 'getGroups']);
    Route::post('/average-telemetry', [NodeController::class, 'getAverageTelemetry']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});


/*
|--------------------------------------------------------------------------
| ZONA DO HARDWARE (Apenas as API Keys dos ESP32 podem entrar)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'ability:sensor:write'])->group(function () {
    Route::post('/nodes/register', [NodeController::class, 'registerNode']);
    Route::post('/telemetry', [TelemetryController::class, 'logData']);
});
