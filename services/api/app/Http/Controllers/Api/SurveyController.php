<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'in:1,2,3,4'],
        ]);

        $survey = Survey::create($validated);

        return response()->json($survey, 201);
    }
}
