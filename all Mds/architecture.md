# Lost & Found Platform - System Architecture

## 1. High-Level Architecture Overview
The platform will follow a modern Client-Server architecture, utilizing a Serverless backend approach for rapid development, built-in security, and seamless scalability.

*   **Client Layer:** A web application built with React (Next.js) that handles routing, UI rendering, and client-side logic.
*   **API & Backend Services:** Managed backend services (Firebase) to handle user authentication, database interactions, and file storage without the need to provision or manage custom servers.
*   **Data Layer:** A NoSQL document database (Firestore) optimized for quick read/write operations and real-time data syncing.

## 2. Technology Stack Selection (Serverless Approach)
Based on the ideation phase, we will proceed with the **Serverless/BaaS (Backend as a Service)** approach.

*   **Frontend Framework:** **Next.js (React)**
    *   *Why?* It provides built-in API routes, excellent performance, Server-Side Rendering (SSR) capabilities (useful for SEO if public lost items need to be indexed), and a robust developer experience.
*   **Styling:** **Tailwind CSS**
    *   *Why?* Utility-first CSS allows for rapid UI development and easy responsive design implementation.
*   **Authentication:** **Firebase Auth**
    *   *Why?* A drop-in solution for email/password and social logins (Google, etc.). It's highly secure and integrates seamlessly with our database security rules.
*   **Database:** **Cloud Firestore (Firebase)**
    *   *Why?* A flexible NoSQL structure fits the `Items` and `Claims` models perfectly. Real-time listeners can be used to instantly notify users of new claim requests.
*   **File Storage:** **Firebase Storage**
    *   *Why?* Native integration with the Firebase ecosystem. Securely stores user-uploaded images for the lost/found items.
*   **Hosting:** **Vercel** (for Next.js frontend) and **Firebase Hosting** (if deploying as a static export).

## 3. Component Architecture (Frontend)
The frontend application will be divided into reusable, modular React components:

*   **Auth Components:** `LoginForm`, `SignUpForm`, `ProtectedRoute` (to wrap authenticated routes).
*   **Item Components:** 
    *   `ItemCard` (Summary view for the main feed)
    *   `ItemList` (Grid or List rendering of multiple ItemCards)
    *   `ItemDetail` (Full-page view with high-res images, detailed description, and the "Claim" button)
    *   `ItemForm` (The reporting form for creating or updating items)
*   **Layout Components:** `Navbar`, `Footer`, `Sidebar` (for search filters and category selection).
*   **Context/Providers:** `AuthProvider` (managing global user session state).

## 4. Database Architecture (Firestore Collections)
The NoSQL schema maps directly to the entities identified in the `idea.md` document.

### `users` Collection
Stores user profile information.
- `uid` (String, Document ID - matches Auth UID)
- `displayName` (String)
- `email` (String)
- `createdAt` (Timestamp)

### `items` Collection
Stores all reported lost and found items.
- `id` (String, Document ID auto-generated)
- `type` (String: `'LOST'` | `'FOUND'`)
- `title` (String)
- `description` (String)
- `status` (String: `'ACTIVE'` | `'RESOLVED'` | `'CANCELLED'`)
- `category` (String: e.g., 'Electronics', 'Keys')
- `location` (String or Firestore GeoPoint)
- `date` (Timestamp)
- `imageUrls` (Array of Strings - links to Firebase Storage)
- `reporterId` (Reference -> `users/uid`)
- `createdAt` (Timestamp)

### `claims` Collection
Manages the workflow of connecting finders and losers.
- `id` (String, Document ID auto-generated)
- `itemId` (Reference -> `items/id`)
- `claimantId` (Reference -> `users/uid` - The person claiming the item)
- `reporterId` (Reference -> `users/uid` - The person who created the item report)
- `status` (String: `'PENDING'` | `'ACCEPTED'` | `'REJECTED'`)
- `message` (String - Optional introductory message)
- `createdAt` (Timestamp)

## 5. Security & Data Flow
1.  **Authentication Flow:** A user authenticates via Firebase Auth. The client receives a JWT token. This token is automatically passed to Firestore and Storage to identify the user.
2.  **Database Rules (Firestore Security Rules):**
    *   `users`: Users can only read and write their own specific document.
    *   `items`: Anyone (or authenticated users only, depending on privacy settings) can read items where `status == 'ACTIVE'`. Only the user whose `uid` matches the `reporterId` can update or delete that specific item.
    *   `claims`: Any authenticated user can create a claim. However, only the `reporterId` of the associated item can read the claim and update its status to `'ACCEPTED'` or `'REJECTED'`.
3.  **Image Upload Flow:** The client requests an upload to Firebase Storage. Security rules validate that the user is authenticated. The image is stored, a public download URL is returned to the client, and that URL is subsequently saved in the `items` document in Firestore.
