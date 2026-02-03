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
        Schema::create('instance_types', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->string('familia');
            $table->integer('vcpus');
            $table->string('procesador');
            $table->decimal('memoria_gb', 8, 2);
            $table->string('almacenamiento_incluido')->nullable();
            $table->string('rendimiento_red');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instance_types');
    }
};
