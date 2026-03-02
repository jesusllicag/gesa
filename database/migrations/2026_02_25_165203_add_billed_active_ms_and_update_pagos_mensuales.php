<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->bigInteger('billed_active_ms')->default(0)->after('active_ms');
        });

        Schema::table('pagos_mensuales', function (Blueprint $table) {
            $table->dropForeign(['server_id']);
            $table->dropUnique(['server_id', 'anio', 'mes']);
            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
            $table->unsignedBigInteger('created_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('billed_active_ms');
        });

        Schema::table('pagos_mensuales', function (Blueprint $table) {
            $table->dropForeign(['server_id']);
            $table->unique(['server_id', 'anio', 'mes']);
            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
            $table->unsignedBigInteger('created_by')->nullable(false)->change();
        });
    }
};
