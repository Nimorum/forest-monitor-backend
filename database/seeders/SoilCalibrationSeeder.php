<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Node;
use App\Models\SoilCalibration;

class SoilCalibrationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $nodes = Node::all();

        if ($nodes->isEmpty()) {
            $this->command->info('no nodes found. Skipping soil calibration seeding.');
            return;
        }

        $count = 0;

        foreach ($nodes as $node) {
            SoilCalibration::updateOrCreate(
                ['node_id' => $node->id],
                [
                    'raw_air_value' => 3000,
                    'raw_water_value' => 1200,

                ]
            );
            $count++;
        }

        $this->command->info("Calibrações de solo processadas para {$count} nós com sucesso!");
    }
}