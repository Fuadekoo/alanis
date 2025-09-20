export { auth as middleware } from "@/lib/auth";

// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";

// export default auth(async (request) => {
//   const newHeaders = new Headers(request.headers);

//   newHeaders.set("al-anis-url", request.url);

//   return NextResponse.next({ request: { ...request, headers: newHeaders } });
// });

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\.png$).*)"],
};
