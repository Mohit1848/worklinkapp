# WorkLink

A modern web platform designed to connect professionals and streamline work management. This application is built with **React** and **Vite**, utilizing **Firebase** for backend services and **Tailwind CSS** for styling.

## 📂 Project Structure

* **`src/`**: Main application source code.
    * **`config/`**: Configuration files (contains `firebase.js` for database connection).
    * **`App.jsx`**: Main application component.
    * **`main.jsx`**: Entry point.
* **`public/`**: Static assets.
* **`WorkLinkMobile/`**: (Optional) Directory containing the mobile version or mobile-specific modules of the application.
* **`tailwind.config.js`**: Styling configuration.
* **`vite.config.js`**: Build tool configuration.

## 🚀 Tech Stack

* **Frontend:** [React.js](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend/Auth:** [Firebase](https://firebase.google.com/)
* **Language:** JavaScript (JSX)

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16 or higher)
* A Firebase Project (for API keys)

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd worklink-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    * Open `src/config/firebase.js`.
    * You will likely need to add your own Firebase configuration object (API Key, Auth Domain, Project ID, etc.) if it is not already present or if you are setting up a fresh environment.
    * *Tip: It is best practice to use `.env` files for these keys.*

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    * The app will typically run at `http://localhost:5173`.

## 📱 Mobile Module

There is a `WorkLinkMobile` directory included in this project. To work on the mobile specific components:
1.  Navigate to the folder:
    ```bash
    cd WorkLinkMobile
    ```
2.  Install its specific dependencies (if separate):
    ```bash
    npm install
    ```

## 📦 Build for Production

To create an optimized build for deployment:
```bash
npm run build
