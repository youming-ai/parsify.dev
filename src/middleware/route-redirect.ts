import { NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
	// 如果访问根路径，重定向到创新设计页面
	if (request.nextUrl.pathname === '/') {
		const url = request.nextUrl.clone();
		url.pathname = '/tools/innovative';
		return NextResponse.redirect(url, 301);
	}
	return NextResponse.next();
}
