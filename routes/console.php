<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\ProcessNodeAlarms;
use App\Jobs\ProcessSoilCalibration;

Schedule::command('db:seed --class=TelemetrySeeder --force')->everyTenMinutes();
Schedule::job(new ProcessSoilCalibration)->monthlyOn(1, '02:00');
Schedule::job(new ProcessNodeAlarms)->cron('5 * * * *');