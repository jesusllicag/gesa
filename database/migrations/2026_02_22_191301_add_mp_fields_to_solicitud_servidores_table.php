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
        Schema::table('solicitud_servidores', function (Blueprint $table) {
            $table->string('mp_payment_id')->nullable()->after('medio_pago');
            $table->string('mp_payment_status')->nullable()->after('mp_payment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('solicitud_servidores', function (Blueprint $table) {
            $table->dropColumn(['mp_payment_id', 'mp_payment_status']);
        });
    }
};
