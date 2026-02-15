<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    protected function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Forbidden');
    }

    public function index(Request $request)
    {
        $query = Service::query();

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        } else {
            $this->ensureAdmin($request);
        }

        return response()->json(
            $query->orderBy('code')->get()
        );
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:services,code'],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $service = Service::create($validated);

        return response()->json($service, 201);
    }

    public function update(Request $request, Service $service)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:10', 'unique:services,code,' . $service->id],
            'name' => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($validated);

        return response()->json($service);
    }

    public function destroy(Request $request, Service $service)
    {
        $this->ensureAdmin($request);

        // Check if service is assigned to any counter
        $assignedCount = \App\Models\Counter::whereJsonContains('assigned_services', $service->id)->count();
        
        if ($assignedCount > 0) {
            return response()->json([
                'message' => 'Tidak dapat menghapus layanan yang masih ditugaskan ke loket.'
            ], 422);
        }

        $service->delete();

        return response()->json(['message' => 'Layanan berhasil dihapus.']);
    }
}
