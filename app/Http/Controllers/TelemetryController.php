<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Node;
use Carbon\Carbon;
use App\Models\Telemetry;

class TelemetryController extends Controller
{
    public function logData(Request $request)
    {

        $validated = $request->validate([
            'mac_address' => 'required|string|exists:nodes,mac_address',
            'temperature' => 'nullable|numeric',
            'humidity' => 'nullable|numeric',
            'wind_speed' => 'nullable|numeric',
            'soil_moisture' => 'nullable|numeric',
            'battery_voltage' => 'nullable|numeric',
            'collected_at' => 'nullable|date',
        ]);

        $node = Node::where('mac_address', $validated['mac_address'])->first();

        $telemetry = $node->telemetries()->create([
            'temperature' => $validated['temperature'] ?? null,
            'humidity' => $validated['humidity'] ?? null,
            'wind_speed' => $validated['wind_speed'] ?? null,
            'soil_moisture' => $validated['soil_moisture'] ?? null,
            'vbat' => $validated['battery_voltage'] ?? null,
            'created_at' => $validated['collected_at'] ?? Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Telemetry data logged successfully!',
            'data' => $telemetry
        ], 201);
    }

    public function getTelemetryHistory(Request $request, $id)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $node = Node::findOrFail($id);

        $user = auth('sanctum')->user();

        if (!$node->is_public) {
            if (!$user || $user->id !== $node->user_id) {
                return response()->json([
                    'message' => 'You do not have permission to access telemetry data for this node.'
                ], 403);
            }
        }
        $start = Carbon::parse($request->start_date);
        $end = Carbon::parse($request->end_date);

        $telemetries = $node->telemetries()
            ->with('node.soilCalibration')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at', 'asc')
            ->get([
                'id',
                'node_id',
                'temperature',
                'humidity',
                'wind_speed',
                'soil_moisture',
                'vbat',
                'created_at'
            ]);

        $formattedData = $telemetries->map(function ($t) {
            return [
                'temperature' => $t->temperature,
                'humidity' => $t->humidity,
                'wind_speed' => $t->wind_speed,
                'soil_moisture' => $t->soil_moisture_percent,
                'vbat' => $t->vbat,
                'created_at' => $t->created_at,
            ];
        });

        return response()->json([
            'node_id' => $node->id,
            'mac_address' => $node->mac_address,
            'is_public' => $node->is_public,
            'longitude' => $node->longitude,
            'latitude' => $node->latitude,
            'period' => [
                'start' => $start->toIso8601String(),
                'end' => $end->toIso8601String(),
            ],
            'total_records' => $telemetries->count(),
            'data' => $formattedData
        ]);
    }

    public function getAverageTelemetry(Request $request)
    {
        $validated = $request->validate([
            'node_ids' => 'required|array|min:1',
            'node_ids.*' => 'integer|exists:nodes,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $nodeIds = Node::whereIn('id', $validated['node_ids'])
            ->where(function ($query) {
                $query->where('user_id', Auth::id())
                    ->orWhere('is_public', true);
            })
            ->pluck('id');

        if ($nodeIds->isEmpty()) {
            return response()->json([
                'message' => 'No accessible nodes found.',
                'data' => []
            ]);
        }

        $hourlyData = Telemetry::query()
            ->join('soil_calibrations as sc', 'telemetries.node_id', '=', 'sc.node_id')
            ->whereIn('telemetries.node_id', $nodeIds)
            ->whereBetween('telemetries.created_at', [$validated['start_date'], $validated['end_date']])
            ->selectRaw('
                DATE_FORMAT(telemetries.created_at, "%Y-%m-%d %H:00:00") as hour,
                AVG(telemetries.temperature) as avg_temperature,
                AVG(telemetries.humidity) as avg_humidity,
                AVG(telemetries.wind_speed) as avg_wind_speed,
                AVG(
                    CASE 
                        WHEN sc.raw_air_value = sc.raw_water_value THEN 0
                        ELSE GREATEST(0, LEAST(100, ((sc.raw_air_value - telemetries.soil_moisture) / (sc.raw_air_value - sc.raw_water_value)) * 100))
                    END
                ) as avg_soil_moisture,
                AVG(telemetries.vbat) as avg_vbat
            ')
            ->groupBy('hour')
            ->orderBy('hour', 'ASC')
            ->get();

        if ($hourlyData->isEmpty()) {
            return response()->json([
                'message' => 'No telemetry data found for the specified period.',
                'data' => []
            ]);
        }

        return response()->json([
            'message' => 'Hourly average telemetry data retrieved successfully.',
            'data' => $hourlyData
        ]);
    }
}