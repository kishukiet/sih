@@ .. @@
export default function Navigation() {
-  const { user, logout } = useAuth();
-  const navigate = useNavigate();
-
-  const handleLogout = () => {
-    logout();
-    navigate('/');
-  };
+  const { user } = useAuth();

   const navItems = [
@@ .. @@
           <div className="flex items-center space-x-4">
             <div className="text-sm">
-              <span className="text-slate-300">Welcome, </span>
-              <span className="font-medium">{user?.role}</span>
+              <span className="text-slate-300">System Access - </span>
+              <span className="font-medium">All Roles Available</span>
             </div>
-            <button
-              onClick={handleLogout}
-              className="flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
-            >
-              <LogOut className="w-4 h-4 mr-2" />
-              Logout
-            </button>
+            <div className="flex items-center px-3 py-2 text-sm text-green-400 bg-slate-700 rounded-md">
+              <CheckCircle className="w-4 h-4 mr-2" />
+              Full Access
+            </div>
           </div>
         </div>
       </div>
@@ .. @@
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
-import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
+import { LayoutDashboard, Settings, CheckCircle } from 'lucide-react';
 import { useAuth } from './LoginGuard';