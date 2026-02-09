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
        Schema::table('instance_types', function (Blueprint $table) {
            $table->decimal('precio_hora', 10, 4)->default(0)->after('rendimiento_red');
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->decimal('costo_diario', 10, 4)->default(0)->after('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instance_types', function (Blueprint $table) {
            $table->dropColumn('precio_hora');
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('costo_diario');
        });
    }
};
