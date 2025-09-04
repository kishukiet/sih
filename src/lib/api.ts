@@ .. @@
// Add auth token to requests
api.interceptors.request.use((config) => {
-  const token = localStorage.getItem('token');
-  if (token) {
-    config.headers.Authorization = `Bearer ${token}`;
-  }
+  // Always use system token - no authentication required
+  config.headers.Authorization = `Bearer system-access-token`;
   return config;
 });

 // Handle auth errors
 api.interceptors.response.use(
   (response) => response,
   (error) => {
-    if (error.response?.status === 401) {
-      localStorage.removeItem('token');
-      localStorage.removeItem('user');
-      window.location.href = '/login';
-    }
+    // Remove auth error handling - system has full access
+    console.warn('API Error:', error.response?.status, error.message);
     return Promise.reject(error);
   }
 );