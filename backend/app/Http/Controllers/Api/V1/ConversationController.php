<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreConversationRequest;
use App\Http\Requests\Messaging\StoreMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Property;
use App\Models\RoommateListing;
use App\Models\User;
use App\Services\MessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(
        private readonly MessagingService $messaging,
    ) {}

    /**
     * GET /conversations — every thread this user is in, on either side.
     */
    public function index(Request $request): JsonResponse
    {
        return ConversationResource::collection(
            $this->messaging->listForUser($request->user())
        )->response();
    }

    /**
     * GET /conversations/unread-count — the navbar badge.
     *
     * A dedicated endpoint because the badge polls often and does not
     * need the threads themselves; fetching the whole inbox every 30
     * seconds to display one number would be wasteful.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'unread_count' => $this->messaging->unreadCount($request->user()),
        ]);
    }

    /**
     * POST /conversations — open or continue the thread about a listing
     * and post a message.
     *
     * StoreConversationRequest guarantees exactly one of property_id /
     * roommate_listing_id is present, so which branch runs is decided by
     * which one was sent. A property_id request additionally carries an
     * optional guest_id — present only on the owner-initiated path (the
     * "Contacter" button on OwnerReservationsPage) — which flips who is
     * considered the sender's counterpart: see
     * MessagingService::startOrContinueAsOwner().
     *
     * No Policy check: there is no conversation yet to authorize
     * against. The rules (listing published, not your own, or — for the
     * owner path — guest has a reservation here) are state rules and
     * live in MessagingService.
     */
    public function store(StoreConversationRequest $request): JsonResponse
    {
        $propertyId = $request->validated('property_id');

        if ($propertyId !== null) {
            $guestId = $request->validated('guest_id');

            $conversation = $guestId !== null
                ? $this->messaging->startOrContinueAsOwner(
                    Property::findOrFail($propertyId),
                    $request->user(),
                    User::findOrFail($guestId),
                    $request->validated('body'),
                )
                : $this->messaging->startOrContinue(
                    Property::findOrFail($propertyId),
                    $request->user(),
                    $request->validated('body'),
                );
        } else {
            $conversation = $this->messaging->startOrContinueRoommate(
                RoommateListing::findOrFail($request->validated('roommate_listing_id')),
                $request->user(),
                $request->validated('body'),
            );
        }

        return response()->json([
            'message' => 'Message sent.',
            'conversation' => new ConversationResource($conversation),
        ], 201);
    }

    /**
     * GET /conversations/{conversation} — the thread and its messages.
     *
     * Messages come back NEWEST FIRST (see
     * EloquentConversationRepository::paginateMessages) so page 1 is the
     * bottom of the thread. The frontend reverses for display.
     */
    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = $this->messaging->messages($conversation);

        return response()->json([
            'conversation' => new ConversationResource($conversation),
            'messages' => MessageResource::collection($messages->items()),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * POST /conversations/{conversation}/messages — reply.
     */
    public function storeMessage(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('reply', $conversation);

        $message = $this->messaging->reply(
            $conversation,
            $request->user(),
            $request->validated('body'),
        );

        return response()->json([
            'message' => 'Message sent.',
            'data' => new MessageResource($message),
        ], 201);
    }

    /**
     * PATCH /conversations/{conversation}/read — mark everything the
     * OTHER side sent as read. Never marks your own messages; "read"
     * describes the recipient, not the sender.
     */
    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        return response()->json([
            'marked' => $this->messaging->markRead($conversation, $request->user()),
        ]);
    }
}
