# Lessons System - How It Works

## Overview

Lessons are educational content that users can read/complete in the mobile app. Each lesson awards XP when completed, and progress is tracked server-side.

## Lesson Data Structure

### Lesson Table (`public.lessons`)

Each lesson contains:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Introduction to Financial Literacy",
  "description": "Learn the basics of managing money, budgeting, and saving",
  "category": "finance",
  "content": "# Introduction to Financial Literacy\n\nFinancial literacy is the ability to understand...",
  "xp_reward": 100,
  "duration_minutes": 15,
  "published_at": "2025-11-10T00:00:00Z",
  "created_at": "2025-11-09T12:00:00Z",
  "updated_at": "2025-11-09T12:00:00Z"
}
```

**Fields:**
- `id`: Unique lesson identifier (UUID)
- `title`: Lesson title
- `description`: Short description
- `category`: Category (e.g., "finance", "health", "education")
- `content`: Full lesson content (Markdown or HTML)
- `xp_reward`: XP awarded on completion (e.g., 100 XP)
- `duration_minutes`: Estimated reading time
- `published_at`: When lesson becomes visible (null = draft)
- `created_at` / `updated_at`: Timestamps

## Lesson Progress Tracking

### Progress Table (`public.lesson_progress`)

Tracks each user's progress through lessons:

```json
{
  "id": "progress-uuid-1",
  "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
  "lesson_id": "550e8400-e29b-41d4-a716-446655440000",
  "progress_percent": 75,
  "time_spent_seconds": 600,
  "is_completed": false,
  "completed_at": null,
  "metadata": {
    "last_section": "budgeting",
    "bookmarks": ["section-1", "section-3"]
  },
  "created_at": "2025-11-10T10:00:00Z",
  "updated_at": "2025-11-10T10:15:00Z"
}
```

**Fields:**
- `progress_percent`: 0-100 (how much of lesson is read)
- `time_spent_seconds`: Total time spent reading
- `is_completed`: Whether lesson is fully completed
- `completed_at`: Timestamp when completed (null if not completed)
- `metadata`: Custom data (bookmarks, notes, etc.)

**Rules:**
- One progress record per user per lesson (UNIQUE constraint)
- Latest write wins (by timestamp)
- Progress can be updated incrementally

## Lesson Flow

### 1. User Views Lessons List

**API:** `GET /lessons`

**Response:**
```json
{
  "lessons": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Introduction to Financial Literacy",
      "description": "Learn the basics...",
      "category": "finance",
      "xp_reward": 100,
      "duration_minutes": 15,
      "published_at": "2025-11-10T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Budgeting Basics",
      "description": "How to create and stick to a budget",
      "category": "finance",
      "xp_reward": 150,
      "duration_minutes": 20,
      "published_at": "2025-11-10T00:00:00Z"
    }
  ],
  "total": 50
}
```

**Filtering:**
- `?category=finance` - Filter by category
- `?limit=20&offset=0` - Pagination

### 2. User Starts Reading Lesson

**Mobile App:**
- Fetches lesson content (or uses cached content from list)
- Displays lesson to user
- Starts tracking time

### 3. User Updates Progress (Optional)

**API:** `POST /lessons/{lesson_id}/progress`

**Request:**
```json
{
  "progress_percent": 50,
  "time_spent_seconds": 300,
  "metadata": {
    "last_section": "introduction",
    "scroll_position": 0.5
  }
}
```

**Response:**
```json
{
  "progress_id": "progress-uuid-1",
  "progress_percent": 50,
  "time_spent_seconds": 300,
  "updated_at": "2025-11-10T10:05:00Z"
}
```

**When to Call:**
- Periodically as user scrolls (e.g., every 25% progress)
- When user pauses/resumes
- When user bookmarks a section

**Note:** Latest write wins - if user updates from 50% to 75%, the 75% overwrites the 50%.

### 4. User Completes Lesson

**API:** `POST /lessons/{lesson_id}/complete`

**Request:**
```json
{
  "time_spent_seconds": 900,
  "metadata": {
    "completion_method": "read_full",
    "quiz_score": null
  }
}
```

**Headers:**
- `Idempotency-Key`: Required (UUID) - Prevents double XP award

**Response:**
```json
{
  "completion_id": "completion-uuid-1",
  "xp_awarded": 100,
  "total_xp": 5100,
  "completed_at": "2025-11-10T10:15:00Z"
}
```

**What Happens:**
1. Server checks if lesson already completed (idempotent)
2. If not completed:
   - Updates `lesson_progress`:
     - Sets `is_completed = true`
     - Sets `completed_at = NOW()`
     - Updates `progress_percent = 100`
   - Awards XP via `xp_ledger`:
     - Inserts entry with `source = 'lesson_completion'`
     - `xp_delta = lesson.xp_reward`
     - `metadata = { lesson_id, completion_id }`
3. Returns updated XP balance

**Idempotency:**
- If called again with same `Idempotency-Key`, returns same response
- XP is only awarded once per lesson completion
- User can complete same lesson multiple times, but only first completion awards XP

## Example: Complete Lesson Flow

### Step 1: User Opens App
```
GET /lessons?category=finance
→ Returns list of finance lessons
```

### Step 2: User Selects a Lesson
```
User taps "Introduction to Financial Literacy"
Mobile app displays lesson content
```

### Step 3: User Reads (25% complete)
```
POST /lessons/550e8400.../progress
{
  "progress_percent": 25,
  "time_spent_seconds": 120
}
→ Progress saved
```

### Step 4: User Reads More (50% complete)
```
POST /lessons/550e8400.../progress
{
  "progress_percent": 50,
  "time_spent_seconds": 300
}
→ Progress updated (overwrites 25%)
```

### Step 5: User Completes Lesson
```
POST /lessons/550e8400.../complete
Headers: { "Idempotency-Key": "uuid-123" }
{
  "time_spent_seconds": 900
}
→ XP awarded: 100
→ Total XP: 5100
→ Lesson marked as completed
```

### Step 6: User Tries to Complete Again (Same Idempotency Key)
```
POST /lessons/550e8400.../complete
Headers: { "Idempotency-Key": "uuid-123" }
→ Returns same response (no duplicate XP)
```

## XP Award Rules

1. **One XP Award Per Lesson**: Each lesson can only award XP once per user
2. **Idempotent Completion**: Same `Idempotency-Key` = same result (no double award)
3. **Server-Side Calculation**: XP balance is always `SUM(xp_ledger)` - never client-calculated
4. **Immediate Update**: XP is added to ledger immediately upon completion

## Lesson Categories

Examples:
- `finance` - Financial literacy
- `health` - Health and wellness
- `education` - Educational content
- `business` - Business skills
- `technology` - Tech skills

## Content Format

Lessons can store content as:
- **Markdown**: For rich text formatting
- **HTML**: For complex layouts
- **Plain Text**: For simple content

The mobile app renders the content appropriately.

## Admin: Creating Lessons

Lessons are created via database (admin panel or migration):

```sql
INSERT INTO public.lessons (
  title,
  description,
  category,
  content,
  xp_reward,
  duration_minutes,
  published_at
) VALUES (
  'Introduction to Financial Literacy',
  'Learn the basics of managing money',
  'finance',
  '# Lesson Content Here...',
  100,
  15,
  NOW() -- Publish immediately
);
```

## Summary

- **Lessons** = Educational content with XP rewards
- **Progress** = Tracks reading progress (0-100%)
- **Completion** = Awards XP once (idempotent)
- **XP** = Added to ledger immediately
- **Latest Write Wins** = Progress updates overwrite previous values

