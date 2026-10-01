# CrewUp — Onboarding

> **Status:** Current · 1 October 2026 · replaces Draft v0.1
> **What this is:** the onboarding flow as it works in the app now.

Onboarding starts after someone has an account. Beta and the full launch share the same profile screens. They only differ at the end.

| Path | When | Ends at |
|---|---|---|
| Beta sign-up | App mode is beta | “You’re on the list”, then Edit profile. No home, trips, or chat. |
| Standard onboarding | App mode is launched | Home. |

Mode comes from the server (`CREWUP_APP_MODE`). The app does not assume launched when that request fails.

A person who finished beta is not treated as fully onboarded. After launch they return at the review screen, with their answers already filled in, then accept the launch steps.

---

## Screens

House rules come first, once per account, stored on the device. They have no progress bar. Agreeing opens the profile flow.

The lime bar has nine stops. The photo is taken on the display-name screen, so it does not get its own stop.

| # | Screen | Required | What it collects |
|---|---|---|---|
| — | House rules | Yes, once | Be Yourself, Stay Safe, Play it cool, Be Proactive |
| 1 | Create your account | Yes | Username, first name, last name, other names (optional) |
| 2 | How do you want to be seen? | Name yes, photo no | Display-name choice, optional photo |
| 3 | About you | Yes | Date of birth, gender, “Show gender on my profile” (on by default) |
| 4 | Languages you speak | At least one, up to ten | Language pills. The device language starts selected. |
| 5 | What are you into? | No | Activities and interests. Skip leaves both empty. |
| 6 | Places | Both cities | Residing city, then home city, on one page |
| 7 | Crew identity | Yes | Role, airline, base airport |
| 8 | Phone number | No | Private number. Skip for now. |
| 9 | This is how crew will see you | — | Profile preview. **I'm Done** |

After I'm Done:

- **Beta:** “Get notified at launch” (skippable), then the holding screen.
- **Launched:** privacy explainer, community guidelines, notification permission, then home. A short roster intro can follow completion.

---

## What each screen is for

### Name and username

The form asks for a first name and a last name. They are stored as one full name, “First Last”. A single name is still allowed. Other names (native script) are optional.

The username is the public handle: 3–20 characters, starts with a letter, `a–z`, `0–9`, `.` or `_`, no two dots or underscores in a row, stored lowercase, unique, and blocked if it is reserved.

### How you want to be seen

Three pills, built from the name they just entered:

- First and last name
- Last name, first initial
- Last name only

The chosen sample is what other crew see. It is stored as the preferred name. The full name stays on the account.

The large photo sits above that name. Tapping it picks a picture. Next works with no photo. The picture is saved without jumping the person to the end of the flow. A later photo step, if the server still has one, moves on and does not clear a photo already saved.

### About you

Date of birth is required, from 18 to 100. It is used to confirm age. Other crew never see it.

Gender is Male, Female, or Rather not say. “Show gender on my profile” starts checked. Unchecking still saves the choice. Other crew then see no gender mark.

### Languages

Pills from the language list. At least one is required.

### What are you into

Two pill groups from the same activity list:

- **Activities** — things to do with other crew (dinner, coffee, hiking, gym, and the rest). These are the tags an event can use.
- **Interests** — background (food, travel, music, museums, and the rest). They show on the profile. They are not offered when creating an event.

Both are optional. On the create-event screen, the person’s activities are listed first, under “Your activities”.

### Places

One page, two searches.

- **Where do you live?** Residing city. The line under the title explains that this helps CrewUp show crew around the same place.
- **Where is your hometown?** Home city. The line under the title explains that this helps CrewUp match people who share a background.

The country comes from the city. Hong Kong and Macao are saved as HK and MO even when the search lists them under China. Both cities are required before Next. Hometown coordinates are kept for the account owner only.

### Crew identity

Role (cabin crew, pilot, ground ops, or other), airline, and base airport. If their airline is not in the list, they see a note to contact support and must pick one that is listed.

### Phone

Optional. Stored privately and never shown on the profile. It is not verified yet.

### Review

A preview of the profile other crew will see.

Centered: photo, display name, a male or female icon immediately to the right when they chose to show gender, @username, and “Member since …” (today, yesterday, or a count of days, months, or years — never a clock time).

Then separate sections, each left out when that detail is missing:

- **Crew** — role, airline, base
- **Places** — residing city and home city, each with its country
- **Languages**, **Activities**, and **Interests** — small lime pills

Birthday and phone are not on this card. **I'm Done** still names any required detail that is missing, and does not finish until those are filled. Activities and interests are not required.

---

## Edit profile

Same order as the flow. The header matches the preview: photo, display name and gender icon, @username, Member since. Tapping the photo changes the photo.

| Row | Edits |
|---|---|
| Name & username | Legal name and username. Does not change the display name. |
| How do you want to be seen? | Display-name pills only |
| About you | Date of birth, gender, show-gender. The row shows the gender choice, not the birthday. |
| Languages you speak | Language pills |
| What are you into? | Activities and interests |
| Places | Residing city and home city |
| Crew identity | Role, airline, base |

The Crew ID sits under those rows. **Phone** is in a **Private** section at the bottom.

Saving a section returns to Edit profile. It does not move someone through onboarding again.

---

## Who can see what

| Detail | Other crew |
|---|---|
| Display name, @username, photo | Yes |
| Gender icon | Only when they left “Show gender on my profile” on, and they did not choose Rather not say |
| Languages, activities, interests, cities, role, airline, base | Yes |
| Member since | Yes, as a relative phrase |
| Date of birth, phone, hometown coordinates | No |

---

## How the screens map to the server

The progress bar counts screens. The server still advances seven profile steps: name and handle, about, residence, crew, phone, photo, review. Display name, languages, and “What are you into?” are extra screens inside those steps. The photo is collected with the display name.

About (date of birth and languages) is saved when both cities are chosen, because the about step also needs the home country. Gender and hometown coordinates are saved on the profile directly. Activities and interests are saved on the person’s activity list, not as a new onboarding step.

Reloading the app before Places is saved can drop the in-memory answers for date of birth, gender, and languages, and return the person to About you.
