<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AlarmController extends Controller
{
    public function checkAndGetAlarms(Request $request)
    {
        $user = $request->user();
        $nodes = $user->nodes()->with('latestTelemetry')->get();

        foreach ($nodes as $node) {
            $telemetry = $node->latestTelemetry;

            if (!$telemetry) {
                continue;
            }

            // VBAT Threshold (e.g. 3.3V)
            if ($telemetry->vbat <= 3.3) {
                Alarm::firstOrCreate([
                    'node_id' => $node->id,
                    'type' => 'vbat_low',
                    'resolved_at' => null,
                ], [
                    'user_id' => $user->id,
                    'message' => "Critical battery level: {$telemetry->vbat}V",
                ]);
            }

            // Risk Threshold: Temp > 35 AND Humidity < 30
            if ($telemetry->temperature >= 35.0 && $telemetry->humidity <= 30.0) {
                Alarm::firstOrCreate([
                    'node_id' => $node->id,
                    'type' => 'fire_risk',
                    'resolved_at' => null,
                ], [
                    'user_id' => $user->id,
                    'message' => "High fire risk detected. Temp: {$telemetry->temperature}°C, Hum: {$telemetry->humidity}%",
                ]);
            }
        }

        $activeAlarms = Alarm::with('node:id,mac_address')
            ->where('user_id', $user->id)
            ->whereNull('resolved_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Alarms retrieved successfully.',
            'data' => $activeAlarms
        ]);
    }

    public function resolveAlarm(Request $request, $id)
    {
        $alarm = Alarm::where('user_id', $request->user()->id)->findOrFail($id);

        if ($alarm->resolved_at) {
            return response()->json([
                'message' => 'Alarm is already resolved.'
            ], 400);
        }

        $alarm->update(['resolved_at' => now()]);

        return response()->json([
            'message' => 'Alarm marked as resolved successfully.'
        ]);
    }
}
