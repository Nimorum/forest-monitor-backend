<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Node extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'mac_address',
        'latitude',
        'longitude',
        'is_public',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function telemetries()
    {
        return $this->hasMany(Telemetry::class);
    }

    public function latestTelemetry()
    {
        return $this->hasOne(Telemetry::class)->latestOfMany();
    }

    public function groups()
    {
        return $this->belongsToMany(NodeGroup::class);
    }
}
