<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Node;

class NodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ponto central (Ex: Pinhal de Leiria)
        $baseLat = 39.833333;
        $baseLng = -8.933333;

        // Offsets para ~500 metros
        $offsetLat = 0.0045; 
        $offsetLng = 0.0058;

        $totalNodes = 10;
        $columns = 5; // Matriz de 2 linhas x 5 colunas

        for ($i = 0; $i < $totalNodes; $i++) {
            // Calcular a Linha e a Coluna atual na matriz
            $row = floor($i / $columns);
            $col = $i % $columns;

            // Calcular as coordenadas exatas deste nó
            $lat = $baseLat + ($row * $offsetLat);
            $lng = $baseLng + ($col * $offsetLng);

            // Gerar um MAC Address aleatório realista
            $macAddress = sprintf('%02X:%02X:%02X:%02X:%02X:%02X', 
                rand(0, 255), rand(0, 255), rand(0, 255), rand(0, 255), rand(0, 255), rand(0, 255)
            );

            // Inserir na base de dados
            Node::updateOrCreate([
                'mac_address' => $macAddress
            ], [
                'user_id' => 1,
                'mac_address' => $macAddress,
                'latitude' => $lat,
                'longitude' => $lng,
                'is_public' => true,
            ]);
        }
    }
}
