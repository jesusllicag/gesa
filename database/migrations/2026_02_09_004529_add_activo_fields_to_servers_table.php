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
            $table->timestamp('first_activated_at')->nullable()->after('costo_diario');
            $table->timestamp('latest_release')->nullable()->after('first_activated_at');
            $table->bigInteger('active_seconds')->default(0)->after('latest_release');
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
                'first_activated_at',
                'latest_release',
                'active_seconds',
            ]);
        });
    }
};
