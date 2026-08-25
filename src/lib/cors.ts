import { NextRequest, NextResponse } from 'next/server';

export function corsMiddleware(request: NextRequest) {
    const origin = request.headers.get('origin');
    
    // Configurar CORS para permitir cookies
    const response = NextResponse.next();
    
    if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
        response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
}

export function handleCORS(request: NextRequest) {
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200 });
    }
    return null;
}
