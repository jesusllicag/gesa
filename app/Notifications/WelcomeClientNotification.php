<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeClientNotification extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(public string $temporaryPassword) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = url('/client/login');

        return (new MailMessage)
            ->subject('Bienvenido a '.config('app.name').' - Credenciales de acceso')
            ->greeting('Hola '.$notifiable->nombre.',')
            ->line('Se ha creado una cuenta para ti en '.config('app.name').'.')
            ->line('Puedes iniciar sesion con las siguientes credenciales:')
            ->line('**Correo electronico:** '.$notifiable->email)
            ->line('**Contrasena temporal:** `'.$this->temporaryPassword.'`')
            ->action('Iniciar Sesion', $loginUrl)
            ->line('Por seguridad, se te pedira que cambies tu contrasena en tu primer inicio de sesion.')
            ->salutation('Saludos, '.config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'temporary_password' => $this->temporaryPassword,
        ];
    }
}
