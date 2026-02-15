<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use Illuminate\Http\Request;

class CounterController extends Controller
{
    protected function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Forbidden');
    }

    public function index(Request $request)
    {
        $query = Counter::query();

        // Non-admin hanya bisa lihat counter yang aktif
        if ($request->user()?->role !== 'admin') {
            $query->where('is_active', true);
        }

        return response()->json(
            $query->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'assigned_services' => ['nullable', 'array'],
            'assigned_services.*' => ['integer', 'distinct', 'exists:services,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $counter = Counter::create($validated);

        return response()->json($counter, 201);
    }

    public function update(Request $request, Counter $counter)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'assigned_services' => ['sometimes', 'array'],
            'assigned_services.*' => ['integer', 'distinct', 'exists:services,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $counter->update($validated);

        return response()->json($counter);
    }

    public function destroy(Request $request, Counter $counter)
    {
        $this->ensureAdmin($request);

        $counter->delete();

        return response()->json(['message' => 'Loket berhasil dihapus.']);
    }
}
