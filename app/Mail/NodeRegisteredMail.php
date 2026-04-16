<?php
namespace App\Mail;

use App\Models\Node;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NodeRegisteredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Node $node
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Confirmação de Registo: Nó {$this->node->mac_address}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.node_registered',
        );
    }
}