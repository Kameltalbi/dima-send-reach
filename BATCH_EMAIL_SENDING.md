# Batch Email Sending System

## Overview

This system enables automatic batch email sending with intelligent contact selection and duplicate prevention. Admins can send campaigns in batches (10k, 15k, 20k, 25k, 30k, or 50k contacts) without manually selecting contacts.

## Key Features

1. **Automatic Contact Selection**: Randomly selects contacts from a list
2. **Duplicate Prevention**: No contact receives the same campaign twice
3. **Resume Capability**: Continues from where it stopped on subsequent batch sends
4. **Volume Options**: 10,000 / 15,000 / 20,000 / 25,000 / 30,000 / 50,000
5. **Real-time Statistics**: Shows total, already sent, and remaining contacts

## Database Schema

### Table: `campaign_sends`

Tracks each contact that has received a campaign:

```sql
CREATE TABLE public.campaign_sends (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT ('sent', 'failed', 'pending'),
  batch_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(campaign_id, contact_id)
);
```

## SQL Functions

### `get_remaining_contacts(listId, campaignId)`
Returns all contacts in a list that have NOT been sent the campaign yet.

### `get_remaining_contacts_count(listId, campaignId)`
Returns the count of remaining contacts.

### `get_sent_contacts_count(listId, campaignId)`
Returns the count of already sent contacts.

### `get_total_contacts_in_list(listId)`
Returns the total number of contacts in a list.

### `pick_random_contacts(listId, campaignId, limit)`
Randomly selects a subset of remaining contacts (up to `limit`).

## API Endpoint

### Edge Function: `send-batch-campaign`

**Endpoint**: `POST /functions/v1/send-batch-campaign`

**Request Body**:
```json
{
  "campaignId": "uuid",
  "listId": "uuid",
  "volume": 10000  // 10000, 15000, 20000, 25000, 30000, or 50000
}
```

**Response**:
```json
{
  "success": true,
  "message": "Batch send initiated successfully",
  "summary": {
    "totalContacts": 50000,
    "alreadySent": 10000,
    "batchSent": 15000,
    "remaining": 25000,
    "batchNumber": 2
  }
}
```

## Usage Flow

1. **Admin selects a campaign** that has a list associated
2. **Clicks "Envoi par lots"** (Batch Send) from the dropdown menu
3. **Dialog opens** showing:
   - Total contacts in list
   - Already sent count
   - Remaining contacts
4. **Selects a volume** from dropdown (10k, 15k, 20k, 25k, 30k, 50k)
   - Volumes exceeding remaining contacts are disabled
5. **Clicks "Envoyer le lot"** (Send Batch)
6. **System automatically**:
   - Selects random contacts from remaining ones
   - Adds them to email queue
   - Marks them as sent in `campaign_sends`
   - Updates statistics

## How It Works

### First Batch Send
1. User selects volume (e.g., 15,000)
2. System queries `pick_random_contacts(listId, campaignId, 15000)`
3. Function returns 15,000 random contacts from the list
4. Records inserted into `campaign_sends` with `status='sent'`
5. Emails added to `email_queue` for processing
6. `process-email-queue` Edge Function sends emails

### Subsequent Batch Sends
1. User selects volume again (e.g., 20,000)
2. System queries `pick_random_contacts()` which automatically excludes:
   - All contacts already in `campaign_sends` for this campaign
3. Returns 20,000 NEW random contacts
4. Process repeats

### Guarantees

- ✅ **No Duplicates**: `UNIQUE(campaign_id, contact_id)` constraint prevents duplicates
- ✅ **Automatic Exclusion**: SQL functions automatically exclude already-sent contacts
- ✅ **Random Selection**: Uses PostgreSQL `ORDER BY RANDOM()` for true randomness
- ✅ **Resume Capability**: Can send multiple batches until all contacts are covered

## UI Component

### `BatchSendDialog`

Located in: `src/components/campaigns/BatchSendDialog.tsx`

**Props**:
- `open`: boolean - Controls dialog visibility
- `onOpenChange`: (open: boolean) => void - Callback for open state changes
- `campaignId`: string - Campaign ID
- `listId`: string | null - List ID (null if no list selected)

**Features**:
- Real-time statistics display
- Volume selection dropdown
- Automatic disabling of unavailable volumes
- Loading states
- Error handling
- Success notifications

## Integration

The batch send feature is integrated into the campaigns list page (`src/pages/Campagnes.tsx`):

- Added "Envoi par lots" menu item in campaign dropdown
- Opens `BatchSendDialog` when clicked
- Only available for campaigns with a `list_id`

## Translations

All UI text is internationalized:

- French: `src/i18n/locales/fr.json` → `batchSend.*`
- English: `src/i18n/locales/en.json` → `batchSend.*`

## Testing

To test the system:

1. Create a campaign with a list containing contacts
2. Navigate to Campaigns page
3. Click the menu (⋮) on a campaign
4. Select "Envoi par lots"
5. Choose a volume and send
6. Verify emails are queued
7. Send another batch - verify no duplicates

## Notes

- The system uses the existing `email_queue` table for actual email sending
- The `process-email-queue` Edge Function handles the actual sending
- Batch sending is asynchronous - emails are queued, not sent immediately
- Statistics update in real-time after each batch send

