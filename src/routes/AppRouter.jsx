import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MenuPage from '../pages/customer/MenuPage';
import LoginPage from '../pages/manager/LoginPage';
import NotAuthorizedPage from '../pages/NotAuthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import KitchenPage from '../pages/kitchen/KitchenPage';
import TableManagementPage from '../pages/manager/TableManagementPage';
import MenuManagementPage from '../pages/manager/MenuManagementPage';
import ReportsPage from '../pages/manager/ReportsPage';
import QRCodePage from '../pages/manager/QRCodePage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/not-authorized" element={<NotAuthorizedPage />} />
        <Route path="/menu/:tableId" element={<MenuPage />} />
        <Route path="/order-status/:sessionId" element={<div>Order Status Coming Soon</div>} />
        <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['kitchen','manager','owner']}><KitchenPage /></ProtectedRoute>} />
        <Route path="/manager/tables" element={<ProtectedRoute allowedRoles={['manager','owner','waiter']}><TableManagementPage /></ProtectedRoute>} />
        <Route path="/manager/menu" element={<ProtectedRoute allowedRoles={['manager','owner']}><MenuManagementPage /></ProtectedRoute>} />
        <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={['owner']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/manager/qr" element={<ProtectedRoute allowedRoles={['manager','owner']}><QRCodePage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}