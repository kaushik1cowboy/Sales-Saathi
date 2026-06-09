# Google Calendar Integration

We have successfully implemented the Google Calendar OAuth integration flow. Below is the documentation of the changes made to the project.

## 1. Database Schema

Appended to `schema.sql`:

```sql
-- CalendarConnections Table
CREATE TABLE public."CalendarConnections" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public."Users"(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    calendar_email TEXT,
    connection_status TEXT DEFAULT 'connected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, provider)
);

ALTER TABLE public."CalendarConnections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public."CalendarConnections"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON public."CalendarConnections"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public."CalendarConnections"
    FOR UPDATE USING (auth.uid() = user_id);

-- UnifiedMeetings Table
CREATE TABLE public."UnifiedMeetings" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public."Users"(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('sales_saathi', 'google', 'outlook')),
    meeting_title TEXT NOT NULL,
    company TEXT,
    meeting_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    external_event_id TEXT,
    attendees JSONB,
    brief_id UUID REFERENCES public."PreMeetingBriefs"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_unifiedmeetings_datetime ON public."UnifiedMeetings"(meeting_datetime);

ALTER TABLE public."UnifiedMeetings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings" ON public."UnifiedMeetings"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings" ON public."UnifiedMeetings"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" ON public."UnifiedMeetings"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" ON public."UnifiedMeetings"
    FOR DELETE USING (auth.uid() = user_id);
```

## 2. Database Abstraction Layer (`src/db.js`)
- Added `upsertCalendarConnection` logic to handle both real Supabase integration and the local storage mock fallback.
- Added `getCalendarConnection` logic to let the UI check if the user is already connected.
- Updated `createBrief` logic so that whenever a `PreMeetingBrief` is generated, a corresponding row is automatically created in `UnifiedMeetings` with the source set to `sales_saathi`.

## 3. Authentication Flow (`src/auth.js`)
- Added a `connectGoogleCalendar()` method to `Alpine.store('auth')`. This initiates a Supabase `linkIdentity` request with Google to ensure the calendar is correctly attached to the currently logged-in user.
- Updated `handleSession(session)` so that immediately after a successful Google redirect, it detects the login provider and automatically sets `connection_status: 'connected'` in the `CalendarConnections` database.

## 4. Settings Interface (`settings.html`)
- Updated the "Integrations" tab to fetch the connection status asynchronously on page load using `db.getCalendarConnection`.
- Adjusted the UI to conditionally hide the "Connect" button and display a green "Connected ✓" text block if the user has successfully linked their Google Calendar.
