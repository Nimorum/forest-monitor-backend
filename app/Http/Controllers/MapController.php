<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Node;

class MapController extends Controller
{
    public function getMapData(Request $request)
    {
        $request->validate([
            'north' => 'required|numeric',
            'south' => 'required|numeric',
            'east' => 'required|numeric',
            'west' => 'required|numeric',
        ]);

        $user = auth('sanctum')->user();

        $nodes = Node::with('latestTelemetry')
            ->whereBetween('latitude', [$request->south, $request->north])
            ->whereBetween('longitude', [$request->west, $request->east])
            ->where(function ($query) use ($user) {
                $query->where('is_public', true);
                if($user) {
                    $query->orWhere('user_id', $user->id);
                }
            })
            ->get();

        //standard GeoJSON
        $features = $nodes->map(function ($node) {
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    // GeoJSON inverte a ordem! É sempre [Longitude, Latitude]
                    'coordinates' => [(float)$node->longitude, (float)$node->latitude]
                ],
                'properties' => [
                    'node_id' => $node->id,
                    'mac_address' => $node->mac_address,
                    'temperature' => $node->latestTelemetry ? $node->latestTelemetry->temperature : null,
                    'wind_speed' => $node->latestTelemetry ? $node->latestTelemetry->wind_speed : null,
                    'humidity' => $node->latestTelemetry ? $node->latestTelemetry->humidity : null,
                    'soil_moisture' => $node->latestTelemetry ? $node->latestTelemetry->soil_moisture_percent : null,
                    'vbat' => $node->latestTelemetry ? $node->latestTelemetry->vbat : null,
                    'last_update' => $node->latestTelemetry ? $node->latestTelemetry->created_at->toIso8601String() : null,
                ]
            ];
        });

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features
        ]);
    }

    public function getNodesHistoryAtTime(Request $request)
    {
        $request->validate([
            'node_ids' => 'required|array',
            'node_ids.*' => 'integer|exists:nodes,id',
            'target_time' => 'required|date',
        ]);

        $user = auth('sanctum')->user();

        $targetTime = \Carbon\Carbon::parse($request->target_time);

        $history = [];

        $nodes = Node::whereIn('id', $request->node_ids)
            ->where(function ($query) use ($user) {
                $query->where('is_public', true);

                if ($user) {
                    $query->orWhere('user_id', $user->id);
                }
            })
        ->get();

        foreach ($nodes as $node) {
            $telemetry = $node->telemetries()
                ->where('created_at', '<=', $targetTime)
                ->latest('created_at')
                ->first();

            if ($telemetry) {
                $history[] = [
                    'node_id' => $node->id,
                    'mac_address' => $node->mac_address,
                    'temperature' => $telemetry->temperature,
                    'humidity' => $telemetry->humidity,
                    'soil_moisture' => $telemetry->soil_moisture,
                    'wind_speed' => $telemetry->wind_speed,
                    'vbat' => $telemetry->vbat,
                    'recorded_at' => $telemetry->created_at->toIso8601String(),
                ];
            }
        }

        return response()->json([
            'target_time' => $targetTime->toIso8601String(),
            'data' => $history
        ]);
    }
}
