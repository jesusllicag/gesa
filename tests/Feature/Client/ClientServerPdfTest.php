<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use App\Models\Server;
use Spatie\LaravelPdf\Facades\Pdf;

beforeEach(function () {
    $this->client = Client::factory()->create(['must_change_password' => false]);
    $this->otherClient = Client::factory()->create(['must_change_password' => false]);
    $this->region = Region::factory()->create();
    $this->os = OperatingSystem::factory()->create();
    $this->image = Image::factory()->create(['operating_system_id' => $this->os->id]);
    $this->instanceType = InstanceType::factory()->create(['precio_hora' => 0.10, 'memoria_gb' => 4]);
});

function makeRunningServer(Client $client, Region $region, OperatingSystem $os, Image $image, InstanceType $instanceType): Server
{
    return Server::factory()->create([
        'client_id' => $client->id,
        'estado' => 'running',
        'region_id' => $region->id,
        'operating_system_id' => $os->id,
        'image_id' => $image->id,
        'instance_type_id' => $instanceType->id,
    ]);
}

it('requires client authentication to download pdf', function () {
    $server = makeRunningServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

    $this->get(route('client.servers.pdf', $server))->assertRedirect('/client/login');
});

it('downloads the pdf for an authenticated client with a running server', function () {
    Pdf::fake();

    $server = makeRunningServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

    $this->actingAs($this->client, 'client')
        ->get(route('client.servers.pdf', $server))
        ->assertSuccessful();

    Pdf::assertRespondedWithPdf(function (\Spatie\LaravelPdf\PdfBuilder $pdf) {
        return $pdf->viewName === 'pdf.activo'
            && array_key_exists('server', $pdf->viewData)
            && str_contains($pdf->downloadName, 'servidor-');
    });
});

it('returns 404 if the server belongs to another client', function () {
    $server = makeRunningServer($this->otherClient, $this->region, $this->os, $this->image, $this->instanceType);

    $this->actingAs($this->client, 'client')
        ->get(route('client.servers.pdf', $server))
        ->assertNotFound();
});

it('returns 404 if the server is not running', function () {
    $server = Server::factory()->create([
        'client_id' => $this->client->id,
        'estado' => 'stopped',
        'region_id' => $this->region->id,
        'operating_system_id' => $this->os->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
    ]);

    $this->actingAs($this->client, 'client')
        ->get(route('client.servers.pdf', $server))
        ->assertNotFound();
});
