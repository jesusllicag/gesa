<?php

namespace App\Notifications;

use App\Models\Server;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ServidorRechazadoClienteNotification extends Notification
{
    public function __construct(public Server $server) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dashboardUrl = url('/client/dashboard');

        return (new MailMessage)
            ->subject('Servidor rechazado')
            ->greeting('Hola '.$notifiable->nombre.',')
            ->line('Has rechazado el servidor **'.$this->server->nombre.'**. Hemos notificado al equipo de administracion.')
            ->line('Si esto fue un error o deseas solicitar un servidor de forma manual, puedes hacerlo desde tu dashboard.')
            ->action('Ir al Dashboard', $dashboardUrl)
            ->salutation('Saludos, '.config('app.name'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'server_id' => $this->server->id,
            'server_nombre' => $this->server->nombre,
        ];
    }
}
