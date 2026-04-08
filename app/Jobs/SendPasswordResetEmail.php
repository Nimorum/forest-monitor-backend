<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Password;

class SendPasswordResetEmail implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $email
    ) {}

    public function handle(): void
    {
        Password::sendResetLink(['email' => $this->email]);
    }
}