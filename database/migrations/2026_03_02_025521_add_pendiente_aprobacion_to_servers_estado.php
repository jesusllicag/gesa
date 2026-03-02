<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->enum('estado', ['running', 'stopped', 'pending', 'terminated', 'pendiente_aprobacion'])
                ->default('pending')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->enum('estado', ['running', 'stopped', 'pending', 'terminated'])
                ->default('pending')
                ->change();
        });
    }
};
