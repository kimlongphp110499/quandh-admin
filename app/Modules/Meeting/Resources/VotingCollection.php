<?php

namespace App\Modules\Meeting\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class VotingCollection extends ResourceCollection
{
    public $collects = VotingResource::class;

    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }
}
