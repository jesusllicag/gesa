<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use App\Models\Server;
use App\Models\User;
use Spatie\LaravelPdf\Facades\Pdf;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->region = Region::factory()->create();
    $this->os = OperatingSystem::factory()->create();
    $this->image = Image::factory()->create(['operating_system_id' => $this->os->id]);
    $this->instanceType = InstanceType::factory()->create(['precio_hora' => 0.10, 'memoria_gb' => 4]);
    $this->client = Client::factory()->create(['must_change_password' => false]);
});

it('requires authentication to download pdf', function () {
    $server = Server::factory()->create([
        'client_id' => $this->client->id,
        'region_id' => $this->region->id,
        'operating_system_id' => $this->os->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
    ]);

    $this->get(route('activos.pdf', $server))->assertRedirect('/admin/login');
});

it('downloads the activo pdf for an authenticated admin', function () {
    Pdf::fake();

    $server = Server::factory()->create([
        'client_id' => $this->client->id,
        'region_id' => $this->region->id,
        'operating_system_id' => $this->os->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'nombre' => 'mi-servidor-prod',
    ]);

    $this->actingAs($this->admin)
        ->get(route('activos.pdf', $server))
        ->assertSuccessful();

    Pdf::assertRespondedWithPdf(function (\Spatie\LaravelPdf\PdfBuilder $pdf) {
        return $pdf->viewName === 'pdf.activo'
            && array_key_exists('server', $pdf->viewData)
            && array_key_exists('activities', $pdf->viewData)
            && array_key_exists('costoMensualEstimado', $pdf->viewData)
            && array_key_exists('pagosPendientes', $pdf->viewData)
            && str_contains($pdf->downloadName, 'activo-');
    });
});

it('returns 404 for a non-existent server', function () {
    $this->actingAs($this->admin)
        ->get('/admin/activos/servidor-que-no-existe/pdf')
        ->assertNotFound();
});
