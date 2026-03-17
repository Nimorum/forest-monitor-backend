<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Node;

class TelemetrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $nodes = Node::all();

        if ($nodes->isEmpty()) {
            $this->command->warn('No nodes found in the database. Please run NodeSeeder first to create some nodes before seeding telemetry data.');
            return;
        }

        foreach ($nodes as $node) {

            $node->telemetries()->create([
                // Temperatura: 15.0 ºC a 38.0 ºC
                'temperature' => mt_rand(150, 380) / 10,
                
                // Humidade do ar: 20.0% a 85.0%
                'humidity' => mt_rand(200, 850) / 10,
                
                // Velocidade do vento: 0.0 a 45.0 km/h
                'wind_speed' => mt_rand(0, 450) / 10,
                
                // Humidade do solo: 10.0% a 60.0% (floresta no verão costuma ser seca)
                'soil_moisture' => mt_rand(100, 600) / 10,
                
                // Tensão da Bateria (Vbat): 3.20V (vazia) a 4.20V (cheia)
                'vbat' => mt_rand(320, 420) / 100, 
            ]);
        }

        $this->command->info('New Telemetry readings inserted for ' . $nodes->count() . ' sensors successfully!');
    }
}
