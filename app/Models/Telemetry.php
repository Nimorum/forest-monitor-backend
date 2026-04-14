<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Telemetry extends Model
{
    use HasFactory;

    protected $fillable = [
        'node_id',
        'temperature',
        'humidity',
        'wind_speed',
        'soil_moisture',
        'vbat',
    ];

    protected $appends = ['soil_moisture_percent'];

    public function node()
    {
        return $this->belongsTo(Node::class);
    }

    public function getSoilMoisturePercentAttribute()
    {
        if (!$this->raw_soil_moisture || !$this->node || !$this->node->soilCalibration) {
            return null;
        }

        $cal = $this->node->soilCalibration;
        $raw = $this->raw_soil_moisture;
        $air = $cal->raw_air_value;
        $water = $cal->raw_water_value;

        if ($air == $water) return 0;

        $percent = (($air - $raw) / ($air - $water)) * 100;

        return max(0, min(100, round($percent, 1)));
    }
}
