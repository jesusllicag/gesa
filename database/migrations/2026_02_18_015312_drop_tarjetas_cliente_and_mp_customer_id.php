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
        Schema::dropIfExists('tarjetas_cliente');

        if (Schema::hasColumn('clients', 'mp_customer_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropColumn('mp_customer_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('tarjetas_cliente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('mp_card_id');
            $table->string('last_four_digits', 4);
            $table->string('first_six_digits', 6);
            $table->string('brand');
            $table->unsignedTinyInteger('expiration_month');
            $table->unsignedSmallInteger('expiration_year');
            $table->string('cardholder_name');
            $table->string('payment_type');
            $table->timestamps();

            $table->unique(['client_id', 'mp_card_id']);
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->string('mp_customer_id')->nullable();
        });
    }
};
