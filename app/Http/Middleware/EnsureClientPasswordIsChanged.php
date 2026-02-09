<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureClientPasswordIsChanged
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $client = auth('client')->user();

        if ($client &&
            $client->must_change_password &&
            ! $request->routeIs('client.password.force-change') &&
            ! $request->routeIs('client.password.force-change.update') &&
            ! $request->routeIs('client.logout')) {
            return redirect()->route('client.password.force-change');
        }

        return $next($request);
    }
}
