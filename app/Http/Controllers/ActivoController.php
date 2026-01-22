<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ActivoController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('activos/index');
    }
}
