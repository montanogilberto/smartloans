/**
 * AdminPage — router shell only. Implementation lives in Admin/ (MVVM).
 * Route: /admin/:section? — only the GMO Prestamos platform admin sees data.
 */
import React from 'react';
import './AdminPage.css';
import AdminView from './Admin/AdminView';

const AdminPage: React.FC = () => <AdminView />;

export default AdminPage;
