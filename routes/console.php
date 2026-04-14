<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\ProcessSoilCalibration;

Schedule::command('db:seed --class=TelemetrySeeder --force')->everyTenMinutes();
Schedule::job(new ProcessSoilCalibration)->monthlyOn(1, '02:00');
