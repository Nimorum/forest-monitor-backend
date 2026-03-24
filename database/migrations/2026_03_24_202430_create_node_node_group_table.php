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
        Schema::create('node_node_group', function (Blueprint $table) {
            $table->foreignId('node_id')->constrained()->cascadeOnDelete();
            $table->foreignId('node_group_id')->constrained()->cascadeOnDelete();
            $table->primary(['node_id', 'node_group_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('node_node_group');
    }
};
