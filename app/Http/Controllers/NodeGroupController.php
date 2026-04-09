<?php

namespace App\Http\Controllers;

use App\Models\NodeGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NodeGroupController extends Controller
{
    public function index()
    {
        $groups = NodeGroup::where('user_id', Auth::id())
            ->select('id', 'name')
            ->get();

        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $group = NodeGroup::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
        ]);

        return response()->json($group, 201);
    }

    public function destroy(NodeGroup $nodeGroup)
    {
        if ($nodeGroup->user_id !== Auth::id()) {
            abort(403);
        }

        $nodeGroup->delete();

        return response()->json(null, 204);
    }

    public function assignNodes(Request $request, NodeGroup $nodeGroup)
    {
        if ($nodeGroup->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'node_ids' => 'required|array',
            'node_ids.*' => 'exists:nodes,id',
            'is_move' => 'boolean', 
        ]);

        if ($request->boolean('is_move')) {
            $nodes = \App\Models\Node::whereIn('id', $validated['node_ids'])->get();
            foreach ($nodes as $node) {
                $node->groups()->sync([$nodeGroup->id]);
            }
        } else {
            $nodeGroup->nodes()->syncWithoutDetaching($validated['node_ids']);
        }

        return response()->json(['message' => 'Nodes successfully assigned']);
    }
}