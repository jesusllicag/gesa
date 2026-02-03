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
            ],
            [
                'nombre' => 't2.micro',
                'familia' => 'T2',
                'vcpus' => 1,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 1,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
            ],
            [
                'nombre' => 't2.small',
                'familia' => 'T2',
                'vcpus' => 1,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 2,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
            ],
            [
                'nombre' => 't2.medium',
                'familia' => 'T2',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon (hasta 3.3 GHz)',
                'memoria_gb' => 4,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
            ],
            [
                'nombre' => 't2.large',
                'familia' => 'T2',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon (hasta 3.0 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Bajo a Moderado',
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
            ],
            [
                'nombre' => 't3.small',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 2,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
            ],
            [
                'nombre' => 't3.medium',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 4,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
            ],
            [
                'nombre' => 't3.large',
                'familia' => 'T3',
                'vcpus' => 2,
                'procesador' => 'Intel Xeon Platinum 8259CL (2.5 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 5 Gbps',
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
            ],
            [
                'nombre' => 'm5.xlarge',
                'familia' => 'M5',
                'vcpus' => 4,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 16,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
            ],
            [
                'nombre' => 'm5.2xlarge',
                'familia' => 'M5',
                'vcpus' => 8,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 32,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
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
            ],
            [
                'nombre' => 'c5.xlarge',
                'familia' => 'C5',
                'vcpus' => 4,
                'procesador' => 'Intel Xeon Platinum 8124M (3.4 GHz)',
                'memoria_gb' => 8,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
            ],
            [
                'nombre' => 'c5.2xlarge',
                'familia' => 'C5',
                'vcpus' => 8,
                'procesador' => 'Intel Xeon Platinum 8124M (3.4 GHz)',
                'memoria_gb' => 16,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
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
            ],
            [
                'nombre' => 'r5.xlarge',
                'familia' => 'R5',
                'vcpus' => 4,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 32,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
            ],
            [
                'nombre' => 'r5.2xlarge',
                'familia' => 'R5',
                'vcpus' => 8,
                'procesador' => 'Intel Xeon Platinum 8175M (3.1 GHz)',
                'memoria_gb' => 64,
                'almacenamiento_incluido' => 'Solo EBS',
                'rendimiento_red' => 'Hasta 10 Gbps',
            ],
        ];

        foreach ($instanceTypes as $instanceType) {
            InstanceType::create($instanceType);
        }
    }
}
