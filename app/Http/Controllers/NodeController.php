<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Node;
use App\Models\NodeGroup;

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

        $groups = NodeGroup::where('user_id', $user->id)
            ->with(['nodes.latestTelemetry'])
            ->get();

        foreach ($groups as $group) {
            $avgLat = $group->nodes->avg('latitude');
            $avgLng = $group->nodes->avg('longitude');

            $groupedData[] = [
                'groupName' => $group->name,
                'lat' => $avgLat,
                'long' => $avgLng,
                'nodes' => $group->nodes->map(function ($node) {
                    return [
                        'id' => $node->id,
                        'mac_address' => $node->mac_address,
                        'is_public' => $node->is_public,
                        'created_at' => $node->created_at,
                        'latest_telemetry' => $node->latestTelemetry,
                    ];
                })->values()->all()
            ];
        }

        $unassignedNodes = $user->nodes()
            ->doesntHave('groups')
            ->with('latestTelemetry')
            ->get();

        if ($unassignedNodes->isNotEmpty()) {
            $avgLat = $unassignedNodes->avg('latitude');
            $avgLng = $unassignedNodes->avg('longitude');

            $groupedData[] = [
                'groupName' => 'Unassigned Area',
                'lat' => $avgLat,
                'long' => $avgLng,
                'nodes' => $unassignedNodes->map(function ($node) {
                    return [
                        'id' => $node->id,
                        'mac_address' => $node->mac_address,
                        'is_public' => $node->is_public,
                        'created_at' => $node->created_at,
                        'latest_telemetry' => $node->latestTelemetry,
                    ];
                })->values()->all()
            ];
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

    public function getGroups(Node $node)
    {
        if ($node->user_id !== Auth::id()) {
            abort(403);
        }
        return response()->json($node->groups);
    }

    public function updateVisibility(Request $request, Node $node)
    {
        if ($node->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'is_public' => 'required|boolean',
        ]);

        $node->is_public = $validated['is_public'];
        $node->save();

        return response()->json(['message' => 'Node visibility updated successfully.', 'node' => $node]);
    }

    public function updateBulkVisibility(Request $request)
    {
        $validated = $request->validate([
            'node_ids' => 'required|array',
            'node_ids.*' => 'exists:nodes,id',
            'is_public' => 'required|boolean',
        ]);

        Node::whereIn('id', $validated['node_ids'])
            ->where('user_id', Auth::id())
            ->update(['is_public' => $validated['is_public']]);

        return response()->json(null, 204);
    }

    public function canManage(Node $node)
    {
        return ['data' => $node->user_id === Auth::id()];
    }

}    
