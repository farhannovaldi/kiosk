<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requirement;
use Illuminate\Http\Request;

class RequirementController extends Controller
{
    protected function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Forbidden');
    }

    public function index(Request $request)
    {
        $query = Requirement::query();

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        } else {
            $this->ensureAdmin($request);
        }

        return response()->json(
            $query->orderBy('title')->get()
        );
    }

    public function show(Requirement $requirement)
    {
        if (! $requirement->is_active) {
            return response()->json(['message' => 'Requirement is inactive.'], 404);
        }

        return response()->json($requirement);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $requirement = Requirement::create($validated);

        return response()->json($requirement, 201);
    }

    public function update(Request $request, Requirement $requirement)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $requirement->update($validated);

        return response()->json($requirement);
    }

    public function destroy(Request $request, Requirement $requirement)
    {
        $this->ensureAdmin($request);
        $requirement->delete();

        return response()->json(null, 204);
    }
}
