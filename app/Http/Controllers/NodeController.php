<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Node;

class NodeController extends Controller
{
    public function registerNode(Request $request)
    {
        $validated = $request->validate([
            'mac_address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $node = Node::updateOrCreate(
            ['mac_address' => $validated['mac_address']],
            [
                'user_id' => $request->user()->id,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Node registered successfully!',
            'node' => $node
        ], $node->wasRecentlyCreated ? 201 : 200);
    }

    public function getMyNodes(Request $request)
    {
        $user = $request->user();
        $groupedData = [];

        $groups = \App\Models\NodeGroup::where('user_id', $user->id)
            ->with(['nodes.latestTelemetry'])
            ->get();

        foreach ($groups as $group) {
            $groupedData[$group->name] = $group->nodes->map(function ($node) {
                return [
                    'id' => $node->id,
                    'mac_address' => $node->mac_address,
                    'created_at' => $node->created_at,
                    'latest_telemetry' => $node->latestTelemetry,
                ];
            });
        }

        $unassignedNodes = $user->nodes()
            ->doesntHave('groups')
            ->with('latestTelemetry')
            ->get();

        if ($unassignedNodes->isNotEmpty()) {
            $groupedData['Unassigned Area'] = $unassignedNodes->map(function ($node) {
                return [
                    'id' => $node->id,
                    'mac_address' => $node->mac_address,
                    'created_at' => $node->created_at,
                    'latest_telemetry' => $node->latestTelemetry,
                ];
            });
        }

        return response()->json([
            'message' => 'Nodes retrieved and grouped successfully.',
            'data' => $groupedData 
        ]);
    }

    public function deleteNode(Request $request, $id)
    {
        $node = Node::where('id', $id)->where('user_id', $request->user()->id)->first();

        if (!$node) {
            return response()->json(['message' => 'Node not found or does not belong to the user.'], 404);
        }

        $node->delete();

        return response()->json(['message' => 'Node deleted successfully.']);
    }

    public function getGroups(\App\Models\Node $node)
    {
        if ($node->user_id !== \Illuminate\Support\Facades\Auth::id()) {
            abort(403);
        }
        return response()->json($node->groups);
    }

}    
