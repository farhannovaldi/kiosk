<?php

namespace App\Services;

use App\Models\Queue;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;

class TicketPrinter
{
    public function printTicket(Queue $queue, int $waitingCount): void
    {
        if (! config('printer.enabled')) {
            return;
        }

        $connector = $this->makeConnector();
        $printer = new Printer($connector);

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text(config('app.name')."\n");
        $printer->text(str_repeat('-', 32)."\n");
        $printer->setTextSize(3, 3);
        $printer->text($queue->ticket_code."\n");
        $printer->setTextSize(1, 1);
        $printer->text($queue->service->name."\n");
        $printer->text(now()->format('d/m/Y H:i')." WIB\n");
        $printer->text("Menunggu: ".$waitingCount."\n");
        $printer->text(str_repeat('-', 32)."\n");
        $printer->cut();
        $printer->close();
    }

    public function printVisitorCard(Queue $queue): void
    {
        if (! config('printer.enabled') || ! $queue->visitor) {
            return;
        }

        $connector = $this->makeConnector();
        $printer = new Printer($connector);

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text(str_repeat('=', 32)."\n");
        $printer->text("KARTU MEMBER KIOSK\n");
        $printer->text(str_repeat('=', 32)."\n");
        $printer->text("Nama: ".$queue->visitor->name."\n");
        $printer->text("NIK: ".$queue->visitor->nik."\n");
        $printer->text(str_repeat('-', 32)."\n");

        try {
            $printer->qrCode($queue->visitor->qr_code_string);
        } catch (\Throwable $exception) {
            $printer->text("Token: ".$queue->visitor->qr_code_string."\n");
        }

        $printer->text("\nSIMPAN KARTU INI\n");
        $printer->text("UNTUK KUNJUNGAN BERIKUTNYA\n");
        $printer->text(str_repeat('=', 32)."\n");
        $printer->cut();

        $printer->close();
    }

    protected function makeConnector(): FilePrintConnector|NetworkPrintConnector
    {
        $connector = config('printer.connector');

        if ($connector === 'file') {
            return new FilePrintConnector(config('printer.file.path'));
        }

        return new NetworkPrintConnector(
            config('printer.network.host'),
            config('printer.network.port')
        );
    }
}
