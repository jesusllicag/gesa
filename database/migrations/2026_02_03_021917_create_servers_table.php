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
        Schema::create('servers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre');
            $table->enum('region', ['us-east-1', 'us-west-2', 'eu-west-1', 'sa-east-1', 'ap-northeast-1']);
            $table->foreignId('operating_system_id')->constrained('operating_systems');
            $table->foreignId('image_id')->constrained('images');
            $table->foreignId('instance_type_id')->constrained('instance_types');
            $table->integer('ram_gb');
            $table->integer('disco_gb');
            $table->enum('disco_tipo', ['SSD', 'HDD']);
            $table->enum('conexion', ['publica', 'privada']);
            $table->string('clave_privada')->nullable();
            $table->enum('estado', ['running', 'stopped', 'pending', 'terminated'])->default('pending');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
