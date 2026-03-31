import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');
    
    // 🔍 Debug-Logging
    console.log('🔐 Interceptor:', {
      url: req.url,
      hasToken: !!token,
      token: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (token) {
      const authReq = req.clone({ 
        headers: req.headers.set('Authorization', `Bearer ${token}`) 
      });
      console.log('✅ Token attached to request');
      return next(authReq);
    }
    
    console.log('⚠️ No token found, sending unauthenticated request');
    return next(req);
};
