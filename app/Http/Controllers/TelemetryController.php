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
        ]);

        $node = Node::where('mac_address', $validated['mac_address'])->first();

        $telemetry = $node->telemetries()->create([
            'temperature' => $validated['temperature'] ?? null,
            'humidity' => $validated['humidity'] ?? null,
            'wind_speed' => $validated['wind_speed'] ?? null,
            'soil_moisture' => $validated['soil_moisture'] ?? null,
            'vbat' => $validated['battery_voltage'] ?? null,
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
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at', 'asc')
            ->get([
                'temperature',
                'humidity',
                'wind_speed',
                'soil_moisture',
                'vbat',
                'created_at'
            ]);

        return response()->json([
            'node_id' => $node->id,
            'mac_address' => $node->mac_address,
            'is_public' => $node->is_public,
            'period' => [
                'start' => $start->toIso8601String(),
                'end' => $end->toIso8601String(),
            ],
            'total_records' => $telemetries->count(),
            'data' => $telemetries
        ]);
    }
}
