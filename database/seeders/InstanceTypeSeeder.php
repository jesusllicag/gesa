<?php

namespace Database\Seeders;

use App\Models\InstanceType;
use Illuminate\Database\Seeder;

class InstanceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $instanceTypes = [
            // T2 - General Purpose (Burstable)
            [
                'nombre' => 't2.nano',
                'familia' => 'T2',
                'vcpus' => 1,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 0.5,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo',
                'precio_hora' => 0.0058,
            ],
            [
                'nombre' => 't2.micro',
                'familia' => 'T2',
                'vcpus' => 1,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 1,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
                'precio_hora' => 0.0116,
            ],
            [
                'nombre' => 't2.small',
                'familia' => 'T2',
                'vcpus' => 1,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 2,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
                'precio_hora' => 0.0230,
            ],
            [
                'nombre' => 't2.medium',
                'familia' => 'T2',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 4,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
                'precio_hora' => 0.0464,
            ],
            [
                'nombre' => 't2.large',
                'familia' => 'T2',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon (hasta 3.0 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
                'precio_hora' => 0.0928,
            ],
            // T3 - General Purpose (Burstable) Next Gen
            [
                'nombre' => 't3.micro',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 1,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
                'precio_hora' => 0.0104,
            ],
            [
                'nombre' => 't3.small',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 2,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
                'precio_hora' => 0.0208,
            ],
            [
                'nombre' => 't3.medium',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 4,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
                'precio_hora' => 0.0416,
            ],
            [
                'nombre' => 't3.large',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
                'precio_hora' => 0.0832,
            ],
            // M5 - General Purpose
            [
                'nombre' => 'm5.large',
                'familia' => 'M5',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.0960,
            ],
            [
                'nombre' => 'm5.xlarge',
                'familia' => 'M5',
                'vcpus' => 4,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 16,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.1920,
            ],
            [
                'nombre' => 'm5.2xlarge',
                'familia' => 'M5',
                'vcpus' => 8,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 32,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.3840,
            ],
            // C5 - Compute Optimized
            [
                'nombre' => 'c5.large',
                'familia' => 'C5',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8124M (3.4 GHz)',
                'memoria_gb' => 4,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.0850,
            ],
            [
                'nombre' => 'c5.xlarge',
                'familia' => 'C5',
                'vcpus' => 4,
                'procesador' => 'Intel Xeon Platinum 8124M (3.4 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.1700,
            ],
            [
                'nombre' => 'c5.2xlarge',
                'familia' => 'C5',
                'vcpus' => 8,
                'procesador' => 'Intel Xeon Platinum 8124M (3.4 GHz)',
                'memoria_gb' => 16,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.3400,
            ],
            // R5 - Memory Optimized
            [
                'nombre' => 'r5.large',
                'familia' => 'R5',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 16,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.1260,
            ],
            [
                'nombre' => 'r5.xlarge',
                'familia' => 'R5',
                'vcpus' => 4,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 32,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.2520,
            ],
            [
                'nombre' => 'r5.2xlarge',
                'familia' => 'R5',
                'vcpus' => 8,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 64,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
                'precio_hora' => 0.5040,
            ],
        ];

        foreach ($instanceTypes as $data) {
            InstanceType::updateOrCreate(
                ['nombre' => $data['nombre']],
                $data
            );
        }
    }
}
