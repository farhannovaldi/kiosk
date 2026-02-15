<?php

return [
    'enabled' => env('PRINTER_ENABLED', false),
    'connector' => env('PRINTER_CONNECTOR', 'network'),
    'network' => [
        'host' => env('PRINTER_HOST', '127.0.0.1'),
        'port' => (int) env('PRINTER_PORT', 9100),
    ],
    'file' => [
        'path' => env('PRINTER_FILE_PATH', storage_path('app/printer-output.txt')),
    ],
];
