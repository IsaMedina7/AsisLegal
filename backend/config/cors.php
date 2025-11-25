<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'core/*', 'legal/*', 'v1/*'], // Agregamos todas las rutas posibles
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // <--- ESTO ES LA CLAVE
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
