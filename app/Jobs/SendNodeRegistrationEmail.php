<?php

namespace App\Jobs;
use App\Models\Node;
use App\Mail\NodeRegisteredMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendNodeRegistrationEmail implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Node $node
    ) {}

    public function handle(): void
    {
        Mail::to($this->node->user->email)->send(
            new NodeRegisteredMail($this->node)
        );
    }
}
