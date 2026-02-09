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
        Schema::create('solicitud_servidores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients');
            $table->string('nombre');
            $table->foreignId('region_id')->constrained('regions');
            $table->foreignId('operating_system_id')->constrained('operating_systems');
            $table->foreignId('image_id')->constrained('images');
            $table->foreignId('instance_type_id')->constrained('instance_types');
            $table->integer('ram_gb');
            $table->integer('disco_gb');
            $table->string('disco_tipo');
            $table->string('conexion');
            $table->string('medio_pago');
            $table->decimal('costo_diario_estimado', 10, 4);
            $table->string('estado')->default('pendiente');
            $table->text('motivo_rechazo')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitud_servidores');
    }
};
