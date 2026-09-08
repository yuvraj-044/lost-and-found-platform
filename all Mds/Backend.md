# Lost & Found Platform - Backend Specifications

## 1. Backend Technology Stack
Based on the architectural shift, we will utilize **Supabase** as our primary Backend-as-a-Service (BaaS). Supabase provides a powerful, open-source alternative to Firebase built heavily around a relational PostgreSQL database.

*   **Database:** **PostgreSQL (via Supabase)**. A highly scalable relational database perfect for structuring users, items, and their complex relationships (like claims).
*   **Authentication:** **Supabase Auth**. Provides secure email/password and OAuth sign-in methods, seamlessly integrating with PostgreSQL via user IDs.
*   **File Storage:** **Supabase Storage**. Used for securely hosting images uploaded by users for lost or found items.
*   **Security & Authorization:** **Row Level Security (RLS)** in PostgreSQL. This replaces Firebase Security Rules, allowing us to define fine-grained access control directly at the database table level.
*   **API Layer:** **PostgREST / Supabase Client**. Supabase automatically generates a secure RESTful API reflecting our database schema, accessible via the `@supabase/supabase-js` library on the frontend.
*   **Edge Functions (Optional):** If we need complex server-side logic (e.g., sending emails upon a successful claim request), we can use Supabase Edge Functions (Deno).

## 2. Database Schema (PostgreSQL)
Migrating from a NoSQL concept to a structured relational model, here is the proposed schema for our Postgres database.

### Table: `users`
*(Note: Supabase handles core auth in `auth.users`, so this is a public profile table linked to the auth system)*
*   `id` (UUID, Primary Key, Foreign Key -> `auth.users.id`)
*   `full_name` (Text)
*   `avatar_url` (Text, nullable)
*   `created_at` (Timestamp with time zone)

### Table: `items`
*   `id` (UUID, Primary Key, auto-generated)
*   `type` (Enum: `'LOST'`, `'FOUND'`)
*   `title` (Text)
*   `description` (Text)
*   `status` (Enum: `'ACTIVE'`, `'RESOLVED'`, `'CANCELLED'`) - Default: 'ACTIVE'
*   `category` (Text)
*   `location` (Text)
*   `date_of_incident` (Date)
*   `reporter_id` (UUID, Foreign Key -> `users.id`)
*   `image_url` (Text, nullable)
*   `created_at` (Timestamp with time zone)
*   `updated_at` (Timestamp with time zone)

### Table: `claims`
*   `id` (UUID, Primary Key, auto-generated)
*   `item_id` (UUID, Foreign Key -> `items.id`)
*   `claimant_id` (UUID, Foreign Key -> `users.id`)
*   `status` (Enum: `'PENDING'`, `'ACCEPTED'`, `'REJECTED'`) - Default: 'PENDING'
*   `message` (Text)
*   `created_at` (Timestamp with time zone)
*   `updated_at` (Timestamp with time zone)

## 3. Security & Row Level Security (RLS) Policies
Supabase relies on PostgreSQL RLS to ensure users can only access data they are authorized to see or modify.

*   **`users` (Profiles) Table:**
    *   *Read:* Anyone can read public user profiles (needed to see who reported an item).
    *   *Write:* Users can only update their own profile row.
*   **`items` Table:**
    *   *Read:* Anyone can read items where `status = 'ACTIVE'`.
    *   *Insert:* Authenticated users can insert an item.
    *   *Update/Delete:* Only the user whose `id` matches `reporter_id` can modify or delete the item.
*   **`claims` Table:**
    *   *Insert:* Any authenticated user can create a claim.
    *   *Read:* A user can only read a claim if they are the `claimant_id` (they made the claim) OR if they are the `reporter_id` of the referenced `items` row (someone claimed their item).
    *   *Update:* Only the `reporter_id` of the referenced item can update the status to `'ACCEPTED'` or `'REJECTED'`.

## 4. API & Data Fetching Strategy (Supabase Client)
The Next.js frontend will communicate with Supabase using the `@supabase/supabase-js` client. 

*   **Server-Side (Next.js App Router):** We will use `@supabase/ssr` to securely fetch data on the server, ensuring protected routes redirect unauthenticated users before page load.
*   **Client-Side (React Components):** The Supabase client will be used for mutations (e.g., submitting the reporting form, updating a claim status) and listening for real-time updates (e.g., subscribing to the `claims` table so a user is instantly notified if someone claims their item).

## 5. Storage Flow
1. User selects an image in the frontend reporting form.
2. The frontend uploads the file directly to the Supabase Storage bucket (`item-images`).
3. Supabase returns a public URL for the uploaded image.
4. The frontend includes this URL when inserting the new record into the `items` Postgres table.
