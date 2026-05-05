import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PagesListPage } from "./pages/PagesListPage";
import { PageEditorPage } from "./pages/PageEditorPage";
import { PublicPreviewPage } from "./pages/PublicPreviewPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { useAuthStore } from "./store/authStore";

export function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/app/pages" : "/login"} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/app/pages"
          element={
            <RequireAuth>
              <PagesListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/pages/:pageId"
          element={
            <RequireAuth>
              <PageEditorPage />
            </RequireAuth>
          }
        />

        <Route path="/p/:slug" element={<PublicPreviewPage />} />

        <Route path="*" element={<Navigate to={token ? "/app/pages" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

