# Oasis

Oasis is a web application for managing deliverers, parents, and kids for a non-profit organization. It is built with React, Vite, and Supabase.

## Prerequisites

-   Node.js (v20+ recommended)
-   npm (v10+ recommended)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/oasis.git
    cd oasis
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root directory and add your Supabase credentials. Use the following template:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_KEY=your_supabase_anon_key
    ```

    > **Note:** These keys are for the client-side application. Ensure you are using the **Anon/Public** key, NOT the Service Role key.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Scripts

-   `npm run dev`: Starts the local development server with Hot Module Replacement (HMR).
-   `npm run build`: Compiles the application for production using TypeScript and Vite.
-   `npm run preview`: Locally previews the production build.
-   `npm run lint`: Runs ESLint to check for code quality and style issues.

## Deployment

This project uses [GitHub Actions](.github/workflows/main.yml) to automatically build and deploy to GitHub Pages.

### Setup

To enable deployment, you must configure the repository secrets in GitHub:

1.  Go to **Settings** > **Secrets and variables** > **Actions**.
2.  Add the following secrets:
    -   `VITE_SUPABASE_URL`
    -   `VITE_SUPABASE_KEY`

Every push to the `main` branch will trigger a deployment.

## Project Structure

-   `src/components`: React components (Pages, Tables, Forms).
-   `src/hooks`: Custom React hooks (`useKid`, `useParent`, etc.).
-   `src/utils`: Helper functions.
-   `src/supabase.ts`: Supabase client configuration and API wrappers.
-   `dataModel.sql`: Database schema definition.

## Supabase Database

The backend is powered by Supabase.
-   **Schema**: Defined in `dataModel.sql`.
-   **Views**: uses generic views like `parent_order_view` and `kid_order_view` to aggregate data.
-   **Security**: Ensure RLS (Row Level Security) policies are enabled on all tables types to secure user data.