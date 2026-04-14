<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SoilCalibration extends Model
{
    protected $primaryKey = 'node_id';
    public $incrementing = false; 

    protected $fillable = [
        'node_id',
        'raw_air_value',
        'raw_water_value',
        'last_auto_calibrated',
    ];

    public function node()
    {
        return $this->belongsTo(Node::class);
    }
}