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
        Schema::table('servers', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete()->after('id');
            $table->string('hostname')->nullable()->after('nombre');
            $table->string('entorno')->nullable()->after('hostname');
            $table->timestamp('fecha_alta')->nullable()->after('costo_diario');
            $table->timestamp('ultimo_inicio')->nullable()->after('fecha_alta');
            $table->bigInteger('tiempo_encendido_segundos')->default(0)->after('ultimo_inicio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn([
                'client_id',
                'hostname',
                'entorno',
                'fecha_alta',
                'ultimo_inicio',
                'tiempo_encendido_segundos',
            ]);
        });
    }
};
