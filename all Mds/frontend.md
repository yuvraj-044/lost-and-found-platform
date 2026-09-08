# Lost & Found Platform - Frontend Specifications

## 1. Frontend Technology Stack
Based on the architecture and ideation, the frontend will be built to deliver a highly interactive, fast, and SEO-friendly experience.

*   **Framework:** **Next.js (App Router)**. This provides built-in routing, optimized rendering (SSR/SSG), and seamless API route capabilities if needed.
*   **Language:** **TypeScript**. For type safety, better developer experience, and fewer runtime errors.
*   **Styling:** **Tailwind CSS**. Utility-first framework for rapid, responsive design.
*   **UI Components:** **shadcn/ui** or **Radix UI** (optional). For accessible, unstyled primitives that we can style with Tailwind to speed up development.
*   **State Management:** 
    *   *Global:* React Context (specifically for Authentication state).
    *   *Server State:* `SWR` or `@tanstack/react-query` for data fetching, caching, and optimistic UI updates when interacting with Firestore.
*   **Forms & Validation:** **React Hook Form** coupled with **Zod** for robust client-side validation before sending data to Firebase.
*   **Icons:** **Lucide React** or **Heroicons**.

## 2. UI/UX Design Guidelines
To ensure a premium, modern feel ("Wow Factor"):
*   **Aesthetics:** Utilize modern web design trends. 
    *   *Dark/Light Mode Support* with a harmonious color palette (e.g., tailored HSL colors rather than basic CSS colors).
    *   *Subtle Glassmorphism* for floating elements like modals or sticky navbars.
*   **Typography:** Modern sans-serif fonts from Google Fonts (e.g., Inter, Outfit, or Plus Jakarta Sans) for clean readability.
*   **Interactivity & Micro-animations:** 
    *   Use Framer Motion or Tailwind transitions for smooth page loads, list re-ordering, and button hover states.
    *   Interactive hover effects on Item Cards to encourage engagement.
    *   Skeleton loaders instead of basic spinners for data fetching states.

## 3. Application Routing (Next.js App Router)
The application will utilize Next.js file-based routing:

*   `/` (Public) - Landing page with a hero section, call to actions, and a preview of recently reported items.
*   `/explore` (Public/Auth) - The main feed to browse and search items. Includes filters (Lost/Found, Category, Date).
*   `/item/[id]` (Public/Auth) - Detailed view of a specific item. Contains the "Claim" button.
*   `/report` (Protected) - The multi-step form to report a new lost or found item.
*   `/dashboard` (Protected) - User's private area to view "My Reports" and "My Claims".
*   `/auth/login` (Public) - Login page.
*   `/auth/signup` (Public) - Registration page.

## 4. Key React Components

### A. Core Layout
*   `Navbar`: Sticky header containing branding, navigation links, global search bar, and user profile avatar/login button.
*   `Footer`: Standard footer with links, copyright, and contact info.

### B. Discovery & Feed
*   `ItemCard`: A visually appealing card displaying the item's primary image, title, type (badge: Lost/Found), location, and time elapsed.
*   `FilterSidebar`: A collapsible sidebar on the `/explore` page allowing users to filter by category (checkboxes), date range, and location.
*   `SearchBar`: A highly visible input for keyword searching.

### C. Reporting Form (`/report`)
*   `ImageUploader`: A drag-and-drop zone that handles uploading files to Firebase Storage and displaying a preview.
*   `LocationPicker`: An input field that could integrate with a map API (like Google Maps Places Autocomplete) to normalize location data.
*   `CategorySelect`: A styled dropdown for selecting item categories.

### D. Workflow & Interaction
*   `ClaimModal`: A popup triggered from the `ItemDetail` page allowing the user to send a message and request contact info exchange.
*   `StatusBadge`: A reusable visual indicator for item statuses (`ACTIVE`, `RESOLVED`) and claim statuses (`PENDING`, `ACCEPTED`, `REJECTED`).

## 5. Data Fetching Strategy
*   **Static Pages:** The landing page (`/`) will be statically generated for maximum performance.
*   **Client-Side Rendering (CSR):** The `/explore` feed will primarily rely on client-side fetching (using SWR/React Query) connected to Firestore to provide a snappy search and filter experience without full page reloads.
*   **Real-time Updates:** The `/dashboard` and specific `ItemDetail` pages (when viewing claims on your own items) will use Firebase real-time listeners (`onSnapshot`) so users instantly see when a claim is made or updated.
