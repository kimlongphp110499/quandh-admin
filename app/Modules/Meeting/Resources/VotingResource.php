<?php

namespace App\Modules\Meeting\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VotingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'meeting_id' => $this->meeting_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'status' => $this->status,
            'started_at' => $this->started_at?->format('d/m/Y H:i:s'),
            'closed_at' => $this->closed_at?->format('d/m/Y H:i:s'),
            'summary' => $this->whenLoaded('results', fn () => $this->summary),
            'created_at' => $this->created_at?->format('d/m/Y H:i:s'),
        ];
    }
}
