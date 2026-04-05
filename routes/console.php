<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('db:seed --class=TelemetrySeeder --force')->everyTenMinutes();
