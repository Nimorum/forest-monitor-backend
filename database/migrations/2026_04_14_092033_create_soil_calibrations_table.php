<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('soil_calibrations', function (Blueprint $table) {
            $table->foreignId('node_id')->primary()->constrained('nodes')->onDelete('cascade');
            $table->integer('raw_air_value')->default(3000);
            $table->integer('raw_water_value')->default(1200);
            $table->timestamp('last_auto_calibrated')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('soil_calibrations');
    }
};
