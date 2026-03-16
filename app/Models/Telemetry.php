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

    // Relação: Esta telemetria pertence a 1 Nó
    public function node()
    {
        return $this->belongsTo(Node::class);
    }
}
