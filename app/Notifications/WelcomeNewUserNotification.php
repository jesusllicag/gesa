<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class WelcomeNewUserNotification extends Notification
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
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Bienvenido a '.config('app.name').' - Verifica tu cuenta')
            ->greeting('Hola '.$notifiable->name.',')
            ->line('Se ha creado una cuenta para ti en '.config('app.name').'.')
            ->line('Para acceder a tu cuenta, primero debes verificar tu correo electronico haciendo clic en el boton de abajo:')
            ->action('Verificar Correo Electronico', $verificationUrl)
            ->line('Una vez verificado tu correo, podras iniciar sesion con las siguientes credenciales:')
            ->line('**Correo electronico:** '.$notifiable->email)
            ->line('**Contrasena temporal:** '.$this->temporaryPassword)
            ->line('Por seguridad, se te pedira que cambies tu contrasena en tu primer inicio de sesion.')
            ->line('Este enlace de verificacion expirara en '.Config::get('auth.verification.expire', 60).' minutos.')
            ->salutation('Saludos, '.config('app.name'));
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
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
