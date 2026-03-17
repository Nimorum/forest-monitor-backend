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
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Node registered successfully!',
            'node' => $node
        ], $node->wasRecentlyCreated ? 201 : 200);
    }
}
