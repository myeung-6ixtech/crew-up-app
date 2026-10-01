# Friends requests and Crew ID

> **Status:** Current · 1 October 2026
> **What this is:** how a crew member shares a Crew ID, finds someone, and sends a friend request.

A Crew ID is a short code on every profile. Friendship itself is still a row in `connections`. Looking someone up and sending the request both go through Nhost functions, not a direct write from the app.

---

## Crew ID

The database column is `friend_id`. The screen label is **Crew ID**.

| | |
|---|---|
| Stored | `CREW` plus 8 characters, no dashes. Example: `CREW8F2K9M4X` |
| Shown | Dashes after the prefix and every four characters: `CREW-8F2K-9M4X` |
| Alphabet | Crockford Base32: `0-9`, `A-H`, `J-N`, `P-T`, `V-Z`. `I`, `L`, `O`, and `U` are left out so the code is easier to read aloud |
| Assigned | Once, by a database trigger when the profile row is created. Existing profiles were backfilled |
| Changed | Not in this version. The owner cannot edit it |
| Unique | Yes |

Typing a code strips spaces and dashes and uppercases it before it is checked. `crew-8f2k-9m4x` and `CREW8F2K9M4X` are the same ID.

### Where the code is shown

| Place | What they can do |
|---|---|
| Edit profile | A card titled **Crew ID**, with the hint “Share this code so other crew can find and add you.” Copy and Share sit on the card |
| Side menu | A compact copy of the same code |
| Another person’s profile | The code is written out as “Crew ID: CREW-8F2K-9M4X” |
| Add friend | The search result repeats the code under their name |

Copy puts the dashed form on the clipboard and the icon switches to a check for a moment. Share opens the system sheet with “Add me on CrewUp! My Crew ID is CREW-8F2K-9M4X.”

---

## Where a request starts

### Friends tab

Title **Friends**. Subtitle “Your crew connections and pending requests.” A person-plus button in the header opens **Add friend**.

**Requests** appears only when someone has asked this person. Each card shows their name, role, and base.

- **Accept** marks that connection accepted. They move into **Your friends**.
- **Decline** blocks that person. It does not leave a declined invitation. A block is heavier than a no.

**Your friends** lists accepted connections. Tapping a card opens their profile. If the list is empty: “No friends yet. Add crew to your network with their Crew ID or suggested matches.” The action is **Add new friend**.

Sent requests are stored, but this tab does not list them and there is no cancel.

### Add friend

The header button opens this screen. Two sections, top to bottom.

**Suggested friends.** A sideways row of people already on CrewUp who are not this person, not already connected, and not blocked. Same base is preferred. Each card shows a photo, name, role, and base. **Send request** sends “Hi — would love to connect on CrewUp!” The button then reads **Requested**, the card drops out of the row, and a toast says “Request sent.” If nobody is left to suggest: “No other crew to suggest right now. Try searching by Crew ID below.”

**Search by Crew ID.** One search field, placeholder “Search by Crew ID.” Search runs when they submit the field.

- The code is not a full Crew ID yet: the field stays quiet. Nothing is called.
- A well-formed code that matches nobody: “No users found. Check the Crew ID and try again.”
- A match: a row with photo, name, role, base, and “Crew ID: CREW-8F2K-9M4X”, plus **Send request**.
- After it sends: the button reads **Requested** and the same toast appears.

Lookup only returns a verified profile, and only these fields: name, role, base, photo, Crew ID, and the id needed to send the request. Email, phone, birthday, and trips are not in the result.

### Other ways a request is sent

| Place | Message stored with the request |
|---|---|
| Suggested friend, or a Crew ID match | “Hi — would love to connect on CrewUp!” |
| Home, **Wave** on someone crossing paths | “Hi — looks like we're crossing paths!” |
| Another person’s profile, **Connect** | No message |

Wave and Connect use the same request function, with the other person’s account id instead of a Crew ID.

---

## What the request function does

`POST /v1/client/friends/lookup` with `{ "friend_id": "CREW-8F2K-9M4X" }`.

`POST /v1/client/friends/request` with either `{ "friend_id": "…" }` or `{ "addressee_id": "…" }`, and an optional `message`.

The caller must be signed in and have finished onboarding. The code is normalized, then resolved to a verified profile.

| Situation | Result |
|---|---|
| The code or the person does not exist | Not found |
| They try to add themselves | “You cannot add yourself.” |
| Either person has blocked the other | “Unable to send request.” |
| They are already friends | “You are already connected.” |
| They already sent a request that is still waiting | The same pending row is returned. A second invite is not created |
| The other person already sent them a request | That request is accepted. They become friends immediately |
| None of the above | A pending connection is created, and the other person gets an in-app notification titled “Connection request” |

The notification carries the connection id and who asked. If writing the notification fails, the request itself still stands.

Accept is a direct update of that row to accepted, from the Friends tab. Decline is a block, from the same card.

---

## What a request is not

There is no separate invitations table. A pending row in `connections` is the request. An accepted row is the friendship.

The code cannot be used to invite someone who does not have an account yet. There is no email, SMS, or `crewup://` link. There is no QR code.

Suggested people and Crew ID search are two doors into the same request. Suggested people are a browse list. The Crew ID is an exact match.
