<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use App\Models\OAuthAccount;
use App\Models\User;

class AuthController extends Controller
{
    protected function resolveProvider(string $provider): ?string
    {
        $provider = strtolower($provider);
        return in_array($provider, ['google', 'github']) ? $provider : null;
    }

    protected function providerConfigured(string $provider): bool
    {
        $cfg = config('services.'.$provider, []);
        return !empty($cfg['client_id']) && !empty($cfg['client_secret']) && !empty($cfg['redirect']);
    }

    public function redirect(string $provider)
    {
        $provider = $this->resolveProvider($provider);
        if (!$provider) {
            abort(404);
        }
        if (!$this->providerConfigured($provider)) {
            return response()->json([
                'error' => 'provider_not_configured',
                'message' => 'Configure as variáveis de ambiente do provider (client_id, client_secret, redirect) em .env',
                'env_keys' => [
                    strtoupper($provider).'_CLIENT_ID',
                    strtoupper($provider).'_CLIENT_SECRET',
                    strtoupper($provider).'_REDIRECT_URI',
                ],
            ], 500);
        }
        if ($provider === 'github') {
            return Socialite::driver('github')->scopes(['user:email'])->redirect();
        }
        return Socialite::driver($provider)->redirect();
    }

    public function callback(string $provider)
    {
        $provider = $this->resolveProvider($provider);
        if (!$provider) {
            abort(404);
        }
        $oauthUser = Socialite::driver($provider)->user();
        $providerUserId = (string) $oauthUser->getId();
        $email = $oauthUser->getEmail();
        $name = $oauthUser->getName() ?: ($oauthUser->user['login'] ?? $email ?? 'user');
        $avatar = $oauthUser->getAvatar();

        $account = OAuthAccount::where('provider', $provider)
            ->where('provider_user_id', $providerUserId)
            ->first();

        if ($account) {
            $account->update([
                'email' => $email,
                'avatar_url' => $avatar,
                'access_token' => $oauthUser->token ?? null,
                'refresh_token' => $oauthUser->refreshToken ?? null,
                'expires_at' => isset($oauthUser->expiresIn) ? now()->addSeconds((int) $oauthUser->expiresIn) : null,
                'scopes' => [],
            ]);
            $user = $account->user;
        } else {
            $user = null;
            if ($email) {
                $user = User::where('email', $email)->first();
            }
            if (!$user) {
                $base = Str::slug($name);
                if (!$base) {
                    $base = 'user';
                }
                $username = substr($base, 0, 24);
                $suffix = 0;
                $final = $username;
                while (User::where('username', $final)->exists()) {
                    $suffix++;
                    $final = $username.$suffix;
                }
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Str::random(24),
                    'username' => $final,
                    'avatar_url' => $avatar,
                ]);
                $user->email_verified_at = now();
                $user->save();
            } else {
                $user->update([
                    'name' => $name ?? $user->name,
                    'avatar_url' => $avatar ?? $user->avatar_url,
                ]);
            }
            $account = OAuthAccount::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_user_id' => $providerUserId,
                'email' => $email,
                'avatar_url' => $avatar,
                'access_token' => $oauthUser->token ?? null,
                'refresh_token' => $oauthUser->refreshToken ?? null,
                'expires_at' => isset($oauthUser->expiresIn) ? now()->addSeconds((int) $oauthUser->expiresIn) : null,
                'scopes' => [],
            ]);
        }

        Auth::login($user, true);

        $front = env('FRONTEND_URL', config('app.url'));
        $target = rtrim($front, '/').'/auth/callback?provider='.$provider;
        return redirect()->away($target);
    }

    public function me()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['authenticated' => false], 200);
        }
        return response()->json([
            'authenticated' => true,
            'user' => $user->only(['id','name','email','username','avatar_url']),
        ]);
    }

    public function logout()
    {
        auth()->logout();
        return response()->json(['logout' => true]);
    }
}
