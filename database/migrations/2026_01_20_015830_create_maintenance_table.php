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
        Schema::create('maintenance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('maintenance_type_id')->constrained('maintenance_types')->restrictOnDelete();
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->text('description');
            $table->text('findings')->nullable();
            $table->text('actions_taken')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance');
    }
};
