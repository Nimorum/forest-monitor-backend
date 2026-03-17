<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Node;
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
            'vbat' => 'nullable|numeric',
        ]);

        $node = Node::where('mac_address', $validated['mac_address'])->first();

        $telemetry = $node->telemetries()->create([
            'temperature' => $validated['temperature'] ?? null,
            'humidity' => $validated['humidity'] ?? null,
            'wind_speed' => $validated['wind_speed'] ?? null,
            'soil_moisture' => $validated['soil_moisture'] ?? null,
            'vbat' => $validated['vbat'] ?? null,
        ]);

        return response()->json([
            'message' => 'Telemetry data logged successfully!',
            'data' => $telemetry
        ], 201);
    }
}