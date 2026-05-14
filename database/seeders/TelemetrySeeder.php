<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Node;

class TelemetrySeeder extends Seeder
{
    public function run(): void
    {
        $nodes = Node::with(['soilCalibration', 'latestTelemetry'])->get();

        if ($nodes->isEmpty()) {
            $this->command->warn('No nodes found in the database.');
            return;
        }

        // Definir os "Baselines" com base no mês atual (Sazonalidade)
        $month = now()->month;
        if ($month >= 6 && $month <= 9) {
            // Verão: Quente e Seco
            $minTemp = 20.0; $maxTemp = 40.0;
            $minHum = 20.0;  $maxHum = 50.0;
            $maxWind = 40.0;
        } elseif ($month == 12 || $month <= 3) {
            // Inverno: Frio e Húmido
            $minTemp = 5.0;  $maxTemp = 18.0;
            $minHum = 60.0;  $maxHum = 95.0;
            $maxWind = 100.0;
        } else {
            // Primavera/Outono: Ameno
            $minTemp = 12.0; $maxTemp = 25.0;
            $minHum = 40.0;  $maxHum = 75.0;
            $maxWind = 40.0;
        }

        $seededCount = 0;

        foreach ($nodes as $node) {
            if ($node->mac_address == '3C:0F:02:ED:C5:10' || $node->mac_address == '3C:0F:02:EE:78:60') {
                continue;
            }

            $air = $node->soilCalibration->raw_air_value ?? 3000;
            $water = $node->soilCalibration->raw_water_value ?? 1200;
            $minRaw = min($air, $water);
            $maxRaw = max($air, $water);

            $last = $node->latestTelemetry; // Vai buscar a última leitura deste nó

            if ($last) {

                // Temp: varia entre -0.5ºC e +0.5ºC a cada 10 min
                $newTemp = $last->temperature + (mt_rand(-5, 5) / 10);

                // Humidade: varia entre -1.5% e +1.5%
                $newHum = $last->humidity + (mt_rand(-15, 15) / 10);

                // Vento: o vento varia até +/- 3 km/h
                $newWind = $last->wind_speed + (mt_rand(-30, 30) / 10);

                // Solo (RAW): Varia +/- 15 pontos do ADC
                $newSoil = $last->soil_moisture + mt_rand(-15, 15);

                // Subtrai entre 0V e 0.01V
                $newVbat = $last->vbat - (mt_rand(0, 10) / 1000);
                if ($newVbat <= 3.20) $newVbat = 4.20; // Simula que alguém foi trocar a bateria!

            } else {
                $newTemp = mt_rand($minTemp * 10, $maxTemp * 10) / 10;
                $newHum = mt_rand($minHum * 10, $maxHum * 10) / 10;
                $newWind = mt_rand(0, 200) / 10;
                $newSoil = mt_rand($minRaw, $maxRaw);
                $newVbat = 4.20;
            }

            $newTemp = max($minTemp, min($maxTemp, $newTemp));
            $newHum  = max($minHum, min($maxHum, $newHum));
            $newWind = max(0, min($maxWind, $newWind));
            $newSoil = max($minRaw, min($maxRaw, $newSoil));

            $node->telemetries()->create([
                'temperature'   => round($newTemp, 1),
                'humidity'      => round($newHum, 1),
                'wind_speed'    => round($newWind, 1),
                'soil_moisture' => (int) $newSoil,
                'vbat'          => round($newVbat, 2),
            ]);

            $seededCount++;
        }

        $this->command->info("New SMART Telemetry readings inserted for {$seededCount} sensors successfully!");
    }
}
