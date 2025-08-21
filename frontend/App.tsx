import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Templates from "./pages/Templates";
import Campaigns from "./pages/Campaigns";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

function AppInner() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster />
    </QueryClientProvider>
  );
}
