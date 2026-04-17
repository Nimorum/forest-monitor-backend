<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Alarm;

class AlarmController extends Controller
{
    public function checkAndGetAlarms(Request $request)
    {
        $user = $request->user();

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
