<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 32)->unique()->nullable()->after('name');
            $table->string('avatar_url')->nullable()->after('username');
            $table->string('location')->nullable()->after('avatar_url');
            $table->string('website_url')->nullable()->after('location');
            $table->text('bio')->nullable()->after('website_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'avatar_url', 'location', 'website_url', 'bio']);
        });
    }
};

