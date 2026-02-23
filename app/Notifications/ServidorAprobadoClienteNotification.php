<?php

namespace App\Notifications;

use App\Models\Server;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ServidorAprobadoClienteNotification extends Notification
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
            ->subject('Servidor aprobado correctamente')
            ->greeting('Hola '.$notifiable->nombre.',')
            ->line('Has aprobado correctamente el servidor **'.$this->server->nombre.'**. El equipo de '.config('app.name').' lo activara en breve.')
            ->line('**Detalles del servidor:**')
            ->line('**Region:** '.($this->server->region?->nombre ?? '-'))
            ->line('**Sistema Operativo:** '.($this->server->operatingSystem?->nombre ?? '-'))
            ->line('**Tipo de Instancia:** '.($this->server->instanceType?->nombre ?? '-'))
            ->line('**RAM:** '.$this->server->ram_gb.' GB')
            ->line('**Disco:** '.$this->server->disco_gb.' GB '.$this->server->disco_tipo)
            ->line('**Costo:** $'.number_format((float) $this->server->costo_diario, 2).'/dia')
            ->action('Ver mi Dashboard', $dashboardUrl)
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
