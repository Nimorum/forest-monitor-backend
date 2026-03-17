<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'User created successfully!',
            'user' => $user
        ], 201);
    }

    public function createGatewayToken(Request $request)
    {
        $request->validate([
            'token_name' => 'required|string|max:255',
        ]);

        $token = $request->user()->createToken($request->token_name, ['sensor:write'])->plainTextToken;

        return response()->json([
            'message' => 'Token generated successfully! SAVE IT NOW, you won\'t be able to see it again.',
            'token' => $token
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401); // 401 = Unauthorized
        }

        $expiresAt = now()->addHours(24);
        $token = $user->createToken('dashboard_token', ['dashboard'], $expiresAt)->plainTextToken;

        return response()->json([
            'message' => 'Login successful!',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function listGatewayTokens(Request $request)
    {
        $tokens = $request->user()->tokens()
            ->where('abilities', 'LIKE', '%"sensor:write"%')
            ->get(['id', 'name', 'last_used_at', 'created_at']);

        return response()->json([
            'tokens' => $tokens
        ]);
    }

    public function revokeGatewayToken(Request $request, $tokenId)
    {
        $token = $request->user()->tokens()->where('id', $tokenId)->first();

        if (!$token) {
            return response()->json([
                'message' => 'Token not found.'
            ], 404);
        }

        $token->delete();

        return response()->json([
            'message' => 'Gateway token revoked successfully!'
        ]);
    }
}
