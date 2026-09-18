import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import Shipments from './pages/Shipments'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import Reports from './pages/Reports'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import POS from './pages/POS'
import NotFound from './pages/NotFound'
import ProtectedRoute from './routes/ProtectedRoute'
import RequireRole from './routes/RequireRole'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RequireRole roles={['ADMIN', 'MANAGER', 'SALES']}>
              <Dashboard />
            </RequireRole>
          }
        />
        <Route
          path="pos"
          element={
            <RequireRole roles={['ADMIN', 'SALES']}>
              <POS />
            </RequireRole>
          }
        />
        <Route
          path="products"
          element={
            <RequireRole roles={['ADMIN', 'SALES', 'WAREHOUSE']}>
              <Products />
            </RequireRole>
          }
        />
        <Route
          path="categories"
          element={
            <RequireRole roles={['ADMIN']}>
              <Categories />
            </RequireRole>
          }
        />
        <Route
          path="customers"
          element={
            <RequireRole roles={['ADMIN', 'SALES']}>
              <Customers />
            </RequireRole>
          }
        />
        <Route
          path="orders"
          element={
            <RequireRole roles={['ADMIN', 'SALES', 'WAREHOUSE']}>
              <Orders />
            </RequireRole>
          }
        />
        <Route
          path="shipments"
          element={
            <RequireRole roles={['ADMIN', 'SALES', 'WAREHOUSE', 'MANAGER']}>
              <Shipments />
            </RequireRole>
          }
        />
        <Route
          path="suppliers"
          element={
            <RequireRole roles={['ADMIN', 'WAREHOUSE', 'MANAGER']}>
              <Suppliers />
            </RequireRole>
          }
        />
        <Route
          path="purchase-orders"
          element={
            <RequireRole roles={['ADMIN', 'WAREHOUSE', 'MANAGER']}>
              <PurchaseOrders />
            </RequireRole>
          }
        />
        <Route
          path="reports"
          element={
            <RequireRole roles={['ADMIN', 'MANAGER']}>
              <Reports />
            </RequireRole>
          }
        />
        <Route
          path="accounts"
          element={
            <RequireRole roles={['ADMIN']}>
              <Accounts />
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRole roles={['ADMIN']}>
              <Settings />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}