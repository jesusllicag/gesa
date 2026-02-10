<?php

use App\Models\Client;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->client = Client::factory()->create([
        'must_change_password' => false,
        'password' => 'current-password',
    ]);
});

describe('update', function () {
    it('requires client authentication', function () {
        $this->put('/client/password')
            ->assertRedirect('/client/login');
    });

    it('updates password with valid data', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/password', [
                'current_password' => 'current-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->client->refresh();
        expect(Hash::check('new-secure-password', $this->client->password))->toBeTrue();
    });

    it('validates current password is correct', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertSessionHasErrors(['current_password']);
    });

    it('validates password confirmation', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/password', [
                'current_password' => 'current-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'different-password',
            ])
            ->assertSessionHasErrors(['password']);
    });

    it('validates required fields', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/password', [])
            ->assertSessionHasErrors(['current_password', 'password']);
    });
});
