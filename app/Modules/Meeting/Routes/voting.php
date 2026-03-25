<?php

use App\Modules\Meeting\VotingController;
use Illuminate\Support\Facades\Route;

Route::get('/{meeting}/votings', [VotingController::class, 'index'])->middleware('permission:meetings.votings.index,web');
Route::post('/{meeting}/votings', [VotingController::class, 'store'])->middleware('permission:meetings.votings.store,web');
Route::patch('/{meeting}/votings/{voting}/status', [VotingController::class, 'changeStatus'])->middleware('permission:meetings.votings.changeStatus,web');
Route::post('/{meeting}/votings/{voting}/vote', [VotingController::class, 'submitVote'])->middleware('permission:meetings.votings.submitVote,web');
Route::get('/{meeting}/votings/{voting}/results', [VotingController::class, 'results'])->middleware('permission:meetings.votings.results,web');
Route::delete('/{meeting}/votings/{voting}', [VotingController::class, 'destroy'])->middleware('permission:meetings.votings.destroy,web');

