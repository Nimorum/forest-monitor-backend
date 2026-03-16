<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Node extends Model
{
    use HasFactory;

    protected $fillable = [
        'mac_address',
        'latitude',
        'longitude',
        'is_public',
    ];

    public function telemetries()
    {
        return $this->hasMany(Telemetry::class);
    }
}
