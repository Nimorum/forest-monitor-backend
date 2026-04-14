<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Node;
use App\Models\Telemetry;
use Illuminate\Support\Facades\Log;

class ProcessSoilCalibration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        // Se quisesses passar parâmetros específicos ao disparar o job, seria aqui
    }

    /**
     * Execute the job.
     */
public function handle(): void
    {
        $nodes = Node::with('soilCalibration')->get();
        Log::info("[Worker] Iniciando auto-calibração anual para {$nodes->count()} nós...");

        foreach ($nodes as $node) {
            $cal = $node->soilCalibration;

            // janela para 12 MESES para captar o Verão e o Inverno
            $readings = Telemetry::where('node_id', $node->id)
                ->where('created_at', '>=', now()->subMonths(12))
                ->whereBetween('soil_moisture', [500, 3800]) 
                ->pluck('soil_moisture')
                ->sort()
                ->values();

            $count = $readings->count();

            // Só calibra se o nó já tiver um histórico sólido 
            if ($count > 3000) {
                $p1_index = (int) floor($count * 0.01);
                $p99_index = (int) floor($count * 0.99);

                $observed_water = $readings[$p1_index];   // O mais húmido do último ano
                $observed_air = $readings[$p99_index]; // O mais seco do último ano

                // Só atualizamos o "Seco" (0%) se o que observamos for mais seco que o de fábrica, 
                // OU se já tiver passado mais de um ano, compensar o drift do hardware.
                $new_air = $cal->raw_air_value;
                if ($observed_air > $cal->raw_air_value || $cal->last_auto_calibrated < now()->subMonths(11)) {
                    $new_air = $observed_air;
                }

                $new_water = $cal->raw_water_value;
                if ($observed_water < $cal->raw_water_value || $cal->last_auto_calibrated < now()->subMonths(11)) {
                    $new_water = $observed_water;
                }

                $cal->update([
                    'raw_air_value' => $new_air,
                    'raw_water_value' => $new_water,
                    'last_auto_calibrated' => now(),
                ]);

                Log::info("[Worker] Nó {$node->id} calibrado: Ar={$new_air}, Água={$new_water}. Amostra: {$count} leituras.");
            } else {
                Log::info("[Worker] Nó {$node->id} ignorado: em período de aprendizagem sazonal ({$count} leituras). Mantém valores de fábrica.");
            }
        }

        Log::info('[Worker] Auto-calibração concluída com sucesso.');
    }
}