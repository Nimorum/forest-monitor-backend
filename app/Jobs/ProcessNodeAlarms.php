<?php
namespace App\Jobs;

use App\Models\User;
use App\Models\Alarm;
use App\Models\Telemetry;
use App\Jobs\SendUserAlarmsEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class ProcessNodeAlarms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $startOfHour = Carbon::now()->subHour()->startOfHour();
        $endOfHour = Carbon::now()->subHour()->endOfHour();

        $users = User::with('nodes')->get();

        foreach ($users as $user) {
            $alarmsReport = [];

            foreach ($user->nodes as $node) {
                $lowBatteryTelemetry = Telemetry::where('node_id', $node->id)
                    ->whereBetween('created_at', [$startOfHour, $endOfHour])
                    ->where('vbat', '<=', 3.3)
                    ->first();

                if ($lowBatteryTelemetry) {
                    $batAlarm = $this->checkBatteryAlarm($node, $lowBatteryTelemetry);
                    if ($batAlarm) {
                        $alarmsReport[] = $batAlarm;
                    }
                }

                $telemetries = Telemetry::with('node.soilCalibration')
                    ->where('node_id', $node->id)
                    ->whereBetween('created_at', [$startOfHour, $endOfHour])
                    ->get();

                $maxRiskValue = 0;
                $worstTelemetry = null;

                foreach ($telemetries as $t) {
                    $risk = $this->calculateFireRisk($t->temperature, $t->humidity, $t->wind_speed, $t->soil_moisture_percent);
                    if ($risk > $maxRiskValue) {
                        $maxRiskValue = $risk;
                        $worstTelemetry = $t;
                    }
                }

                if ($maxRiskValue >= 0.7 && $worstTelemetry) {
                    $fireAlarm = $this->createFireRiskAlarm($node, $worstTelemetry, $maxRiskValue, $startOfHour);
                    if ($fireAlarm) {
                        $alarmsReport[] = $fireAlarm;
                    }
                }
            }

            if ($user->alert_email && count($alarmsReport) > 0) {
                SendUserAlarmsEmail::dispatch($user, $alarmsReport);
            }
        }
    }

    private function checkBatteryAlarm($node, $telemetry): ?Alarm
    {
        $exists = Alarm::where('node_id', $node->id)
            ->where('type', 'vbat_low')
            ->whereNull('resolved_at')
            ->exists();

        if (!$exists) {
            return Alarm::create([
                'node_id' => $node->id,
                'user_id' => $node->user_id,
                'type' => 'vbat_low',
                'message' => "Critical battery level: {$telemetry->vbat}V",
            ]);
        }

        return null;
    }

    private function createFireRiskAlarm($node, $telemetry, $risk, $referenceTime): ?Alarm
    {
        $alarm = Alarm::firstOrCreate([
            'node_id' => $node->id,
            'type' => 'fire_risk',
            'created_at' => $referenceTime->copy()->startOfHour(),
        ], [
            'user_id' => $node->user_id,
            'message' => "High fire risk: Temp :{$telemetry->temperature}°C, Hum:{$telemetry->humidity}% wind: {$telemetry->wind_speed}km/h soil: {$telemetry->soil_moisture_percent}% Risk: " . round($risk * 100) . "%",
        ]);

        return $alarm->wasRecentlyCreated ? $alarm : null;
    }

    private function calculateFireRisk($temp, $hum, $windKmH, $soilMoisture): float
    {
        if ($temp === null || $hum === null || $soilMoisture === null) return 0;

        $svp = 0.6108 * exp((17.27 * $temp) / ($temp + 237.3));
        $vpd = $svp * (1 - ($hum / 100));
        $vpdFactor = min($vpd / 4.0, 1.0);
        
        $soilFactor = max(0, (100 - $soilMoisture) / 100);
        $baseRisk = (0.6 * $vpdFactor) + (0.4 * $soilFactor);
        
        $windMultiplier = 1 + pow(max(0, $windKmH) / 35, 1.2);
        
        $thermalGate = 1 / (1 + exp(-0.5 * ($temp - 15)));

        return min($baseRisk * $windMultiplier * $thermalGate, 1.0);
    }
}
