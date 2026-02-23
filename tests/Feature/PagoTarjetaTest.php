<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Net\MPHttpClient;
use MercadoPago\Net\MPRequest;
use MercadoPago\Net\MPResponse;

beforeEach(function () {
    $this->client = Client::factory()->create(['must_change_password' => false]);
    $this->region = Region::factory()->create();
    $this->os = OperatingSystem::factory()->create();
    $this->image = Image::factory()->create(['operating_system_id' => $this->os->id]);
    $this->instanceType = InstanceType::factory()->create(['precio_hora' => 0.10, 'memoria_gb' => 4]);

    $this->validData = [
        'nombre' => 'mi-servidor-web',
        'region_id' => $this->region->id,
        'operating_system_id' => $this->os->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'ram_gb' => 4,
        'disco_gb' => 50,
        'disco_tipo' => 'SSD',
        'conexion' => 'publica',
        'token' => 'fake-card-token-abc123',
        'installments' => 1,
        'payment_method_id' => 'visa',
        'issuer_id' => null,
        'identification_type' => 'DNI',
        'identification_number' => '12345678',
        'cardholder_name' => 'JOHN DOE',
        'email' => 'test@example.com',
    ];
});

function fakeMpHttpClient(array $responseBody, int $statusCode = 200): MPHttpClient
{
    return new class($responseBody, $statusCode) implements MPHttpClient
    {
        public function __construct(
            private array $responseBody,
            private int $statusCode
        ) {}

        public function send(MPRequest $request): MPResponse
        {
            return new MPResponse($this->statusCode, $this->responseBody);
        }
    };
}

describe('store - authentication', function () {
    it('requires client authentication', function () {
        $this->post('/client/pagos/tarjeta')
            ->assertRedirect('/client/login');
    });
});

describe('store - approved payment', function () {
    it('creates a solicitud when payment is approved', function () {
        MercadoPagoConfig::setHttpClient(fakeMpHttpClient([
            'id' => 123456789,
            'status' => 'approved',
            'status_detail' => 'accredited',
        ]));

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $this->validData)
            ->assertRedirect();

        $this->assertDatabaseHas('solicitud_servidores', [
            'client_id' => $this->client->id,
            'nombre' => 'mi-servidor-web',
            'estado' => 'pendiente',
            'medio_pago' => 'tarjeta_credito',
            'mp_payment_id' => '123456789',
            'mp_payment_status' => 'approved',
        ]);
    });

    it('creates a solicitud when payment is in_process', function () {
        MercadoPagoConfig::setHttpClient(fakeMpHttpClient([
            'id' => 987654321,
            'status' => 'in_process',
            'status_detail' => 'pending_review_manual',
        ]));

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $this->validData)
            ->assertRedirect();

        $this->assertDatabaseHas('solicitud_servidores', [
            'client_id' => $this->client->id,
            'mp_payment_id' => '987654321',
            'mp_payment_status' => 'in_process',
        ]);
    });

    it('stores the correct estimated daily cost', function () {
        MercadoPagoConfig::setHttpClient(fakeMpHttpClient([
            'id' => 111,
            'status' => 'approved',
            'status_detail' => 'accredited',
        ]));

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $this->validData);

        $solicitud = $this->client->solicitudes()->first();
        expect((float) $solicitud->costo_diario_estimado)->toBeGreaterThan(0);
    });
});

describe('store - rejected payment', function () {
    it('does not create a solicitud when payment is rejected', function () {
        MercadoPagoConfig::setHttpClient(fakeMpHttpClient([
            'id' => 999,
            'status' => 'rejected',
            'status_detail' => 'cc_rejected_insufficient_amount',
        ]));

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $this->validData)
            ->assertSessionHasErrors(['payment']);

        $this->assertDatabaseMissing('solicitud_servidores', [
            'client_id' => $this->client->id,
        ]);
    });
});

describe('store - api error', function () {
    it('returns error when MP api throws an exception', function () {
        $errorClient = new class implements MPHttpClient
        {
            public function send(MPRequest $request): MPResponse
            {
                return new MPResponse(400, [
                    'message' => 'Invalid card token',
                    'error' => 'bad_request',
                    'status' => 400,
                ]);
            }
        };
        MercadoPagoConfig::setHttpClient($errorClient);

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $this->validData)
            ->assertSessionHasErrors(['payment']);

        $this->assertDatabaseMissing('solicitud_servidores', [
            'client_id' => $this->client->id,
        ]);
    });
});

describe('store - validation', function () {
    it('requires token field', function () {
        $data = $this->validData;
        unset($data['token']);

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $data)
            ->assertSessionHasErrors(['token']);
    });

    it('accepts null payment_method_id', function () {
        MercadoPagoConfig::setHttpClient(fakeMpHttpClient([
            'id' => 555,
            'status' => 'approved',
            'status_detail' => 'accredited',
        ]));

        $data = $this->validData;
        $data['payment_method_id'] = null;

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $data)
            ->assertSessionDoesntHaveErrors(['payment_method_id']);
    });

    it('requires installments field', function () {
        $data = $this->validData;
        unset($data['installments']);

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $data)
            ->assertSessionHasErrors(['installments']);
    });

    it('validates installments minimum value', function () {
        $data = $this->validData;
        $data['installments'] = 0;

        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', $data)
            ->assertSessionHasErrors(['installments']);
    });

    it('requires server configuration fields', function () {
        $this->actingAs($this->client, 'client')
            ->post('/client/pagos/tarjeta', [])
            ->assertSessionHasErrors([
                'nombre', 'region_id', 'operating_system_id', 'image_id',
                'instance_type_id', 'ram_gb', 'disco_gb', 'disco_tipo', 'conexion',
                'token', 'installments',
            ]);
    });
});
