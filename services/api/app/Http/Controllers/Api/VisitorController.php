<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    public function resolve(Request $request)
    {
        $validated = $request->validate([
            'token' => ['nullable', 'string', 'max:255'],
            'nik' => ['nullable', 'string', 'max:32'],
        ]);

        $token = isset($validated['token']) ? trim($validated['token']) : null;
        $nik = isset($validated['nik']) ? trim($validated['nik']) : null;

        if (! $token && ! $nik) {
            return response()->json([
                'message' => 'Token atau NIK wajib diisi.',
            ], 422);
        }

        $visitor = Visitor::query()
            ->when($token, fn ($query) => $query->where('qr_code_string', $token))
            ->when(! $token && $nik, fn ($query) => $query->where('nik', $nik))
            ->first();

        if (! $visitor) {
            return response()->json([
                'found' => false,
                'message' => 'Data warga tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'found' => true,
            'visitor' => $visitor,
        ]);
    }
}
