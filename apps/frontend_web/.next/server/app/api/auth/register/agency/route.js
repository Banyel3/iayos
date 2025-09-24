(()=>{var a={};a.id=3866,a.ids=[3866],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1183:(a,b,c)=>{var d={"./BurstyRateLimiter":[97090,7],"./BurstyRateLimiter.js":[97090,7],"./ExpressBruteFlexible":[39388,7,9388],"./ExpressBruteFlexible.js":[39388,7,9388],"./RLWrapperBlackAndWhite":[71325,7],"./RLWrapperBlackAndWhite.js":[71325,7],"./RateLimiterAbstract":[79915,7],"./RateLimiterAbstract.js":[79915,7],"./RateLimiterCluster":[95039,7],"./RateLimiterCluster.js":[95039,7],"./RateLimiterDrizzle":[74307,7],"./RateLimiterDrizzle.js":[74307,7],"./RateLimiterDrizzleNonAtomic":[80321,7],"./RateLimiterDrizzleNonAtomic.js":[80321,7],"./RateLimiterDynamo":[73455,7],"./RateLimiterDynamo.js":[73455,7],"./RateLimiterEtcd":[67287,7],"./RateLimiterEtcd.js":[67287,7],"./RateLimiterEtcdNonAtomic":[60445,7],"./RateLimiterEtcdNonAtomic.js":[60445,7],"./RateLimiterMemcache":[29880,7],"./RateLimiterMemcache.js":[29880,7],"./RateLimiterMemory":[14490,7],"./RateLimiterMemory.js":[14490,7],"./RateLimiterMongo":[73929,7],"./RateLimiterMongo.js":[73929,7],"./RateLimiterMySQL":[4195,7],"./RateLimiterMySQL.js":[4195,7],"./RateLimiterPostgres":[17962,7],"./RateLimiterPostgres.js":[17962,7],"./RateLimiterPrisma":[84153,7],"./RateLimiterPrisma.js":[84153,7],"./RateLimiterQueue":[62986,7],"./RateLimiterQueue.js":[62986,7],"./RateLimiterRedis":[40902,7],"./RateLimiterRedis.js":[40902,7],"./RateLimiterRes":[46423,7],"./RateLimiterRes.js":[46423,7],"./RateLimiterSQLite":[70957,7],"./RateLimiterSQLite.js":[70957,7],"./RateLimiterStoreAbstract":[78950,7],"./RateLimiterStoreAbstract.js":[78950,7],"./RateLimiterUnion":[74038,7],"./RateLimiterUnion.js":[74038,7],"./RateLimiterValkey":[23011,7],"./RateLimiterValkey.js":[23011,7],"./RateLimiterValkeyGlide":[65534,7],"./RateLimiterValkeyGlide.js":[65534,7],"./component/BlockedKeys":[17284,7],"./component/BlockedKeys/":[17284,7],"./component/BlockedKeys/BlockedKeys":[67732,7],"./component/BlockedKeys/BlockedKeys.js":[67732,7],"./component/BlockedKeys/index":[17284,7],"./component/BlockedKeys/index.js":[17284,7],"./component/MemoryStorage":[76016,7,6016],"./component/MemoryStorage/":[76016,7,6016],"./component/MemoryStorage/MemoryStorage":[22568,7],"./component/MemoryStorage/MemoryStorage.js":[22568,7],"./component/MemoryStorage/Record":[11239,7],"./component/MemoryStorage/Record.js":[11239,7],"./component/MemoryStorage/index":[76016,7,6016],"./component/MemoryStorage/index.js":[76016,7,6016],"./component/RateLimiterEtcdTransactionFailedError":[41914,7],"./component/RateLimiterEtcdTransactionFailedError.js":[41914,7],"./component/RateLimiterQueueError":[67806,7],"./component/RateLimiterQueueError.js":[67806,7],"./component/RateLimiterSetupError":[52092,7],"./component/RateLimiterSetupError.js":[52092,7],"./component/index.d":[67643,1,7643],"./component/index.d.ts":[67643,1,7643],"./constants":[33074,7,3074],"./constants.js":[33074,7,3074],"./index.d":[3995,1,3995],"./index.d.ts":[3995,1,3995]};function e(a){if(!c.o(d,a))return Promise.resolve().then(()=>{var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b});var b=d[a],e=b[0];return Promise.all(b.slice(2).map(c.e)).then(()=>c.t(e,16|b[1]))}e.keys=()=>Object.keys(d),e.id=1183,a.exports=e},1708:a=>{"use strict";a.exports=require("node:process")},5321:(a,b,c)=>{"use strict";c.d(b,{x:()=>d});let d=new(c(39535)).RateLimiterMemory({points:3,duration:300})},5486:a=>{"use strict";a.exports=require("bcrypt")},7066:a=>{"use strict";a.exports=require("node:tty")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14985:a=>{"use strict";a.exports=require("dns")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},21820:a=>{"use strict";a.exports=require("os")},23620:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(36028),e=c(73789),f=c(29790);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},26421:(a,b,c)=>{"use strict";a.exports=c(44870)},27172:a=>{"use strict";a.exports=require("cluster")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30213:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>J,patchFetch:()=>I,routeModule:()=>E,serverHooks:()=>H,workAsyncStorage:()=>F,workUnitAsyncStorage:()=>G});var d={};c.r(d),c.d(d,{POST:()=>D});var e=c(26421),f=c(97714),g=c(85681),h=c(22369),i=c(37587),j=c(261),k=c(46537),l=c(3463),m=c(1889),n=c(85250),o=c(23620),p=c(29790),q=c(67876),r=c(57749),s=c(86439),t=c(40139),u=c(66555),v=c(75314),w=c(5486),x=c.n(w),y=c(55511),z=c.n(y),A=c(90507),B=c(5321);let C=v.Ikc({businessName:v.YjP(),email:v.YjP().email(),password:v.YjP().min(6)});async function D(a){try{await u.z.$connect();let b=a.headers.get("x-forwarded-for")||"anonymous";try{await B.x.consume(b)}catch(b){let a=Math.round((b?.msBeforeNext||3e5)/1e3);return new Response(JSON.stringify({error:"Too many requests. Try again later.",remainingTime:a,rateLimited:!0}),{status:429})}let c=await a.json(),d=C.safeParse(c);if(!d.success)return new Response(JSON.stringify({error:"Invalid input data"}),{status:400});let{email:e,password:f,businessName:g}=d.data;if(await u.z.accounts.findUnique({where:{email:e}}))return new Response(JSON.stringify({error:"User with this email already exists"}),{status:409});let h=await x().hash(f,10),i=z().randomBytes(20).toString("hex"),j=z().createHash("sha256").update(i).digest("hex"),k=new Date(Date.now()+18e5),l=await u.z.accounts.create({data:{email:e,password:h,isVerified:!1,status:"ACTIVE",verifyToken:j,verifyTokenExpire:k}});await u.z.agency.create({data:{businessName:g,businessDesc:"",accountID:l.accountID}});let m=`${process.env.NEXTAUTH_URL}/auth/verify-email/agency?verifyToken=${i}&id=${l.accountID}`;console.log("Generated agency verification link:",m),console.log("verifyToken:",i),console.log("registerUser.accountID:",l.accountID),console.log("NEXTAUTH_URL:",process.env.NEXTAUTH_URL);let n=function({verificationLink:a,businessName:b="your agency"}){return`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Agency Email - iAyos</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
          line-height: 1.5;
          width: 100% !important;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        
        .container {
          max-width: 390px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }
        
        .email-icon {
          margin: 0 auto 2rem auto;
          padding: 1rem;
          background-color: #dbeafe;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          text-align: center;
        }
        
        .email-icon svg {
          width: 48px;
          height: 48px;
          color: #2563eb;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
          margin: 8px auto 0 auto;
        }
        
        .main-heading {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .greeting {
          font-size: 1.125rem;
          font-weight: 400;
          color: #374151;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .message-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .message-text {
          font-size: 1rem;
          color: #4b5563;
          text-align: center;
          line-height: 1.625;
          margin-bottom: 1rem;
        }
        
        .brand-name {
          font-weight: 600;
          color: #2563eb;
        }
        
        .agency-highlight {
          font-weight: 600;
          color: #7c3aed;
        }
        
        .security-note {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .security-note p {
          font-size: 0.875rem;
          color: #92400e;
        }
        
        .security-note .font-semibold {
          font-weight: 600;
        }
        
        .verify-button {
          display: inline-block;
          width: auto;
          min-width: 200px;
          background-color: #7c3aed;
          color: white !important;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          text-align: center;
          margin: 0 auto 24px auto;
          border: none;
          font-size: 16px;
        }
        
        .verify-button:hover {
          background-color: #6d28d9 !important;
        }
        
        .alternative-link {
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .alternative-text {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
          margin-bottom: 0.75rem;
        }
        
        .link-display {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.75rem;
          text-align: center;
          word-break: break-all;
        }
        
        .link-text {
          font-size: 0.75rem;
          color: #7c3aed;
        }
        
        .help-section {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          width: 100%;
          margin-bottom: 1.5rem;
        }
        
        .help-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .help-list {
          list-style: none;
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .help-list li {
          margin-bottom: 0.25rem;
        }
        
        .help-list li::before {
          content: "• ";
          color: #7c3aed;
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 2rem;
        }
        
        .footer-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
        
        .footer-links {
          font-size: 0.75rem;
        }
        
        .footer-links a {
          color: #7c3aed;
          text-decoration: none;
          margin: 0 0.5rem;
        }
        
        .footer-links a:hover {
          text-decoration: underline;
        }
        
        @media only screen and (max-width: 480px) {
          .container {
            padding: 1rem;
          }
          
          .main-heading {
            font-size: 1.25rem;
          }
          
          .greeting {
            font-size: 1rem;
          }
          
          .message-card {
            padding: 1rem;
          }
          
          .verify-button {
            min-width: 100%;
            display: block;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Email Icon -->
        <div class="email-icon">
          <svg viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        
        <!-- Main Heading -->
        <h1 class="main-heading">Verify Your Agency Email</h1>
        
        <!-- Greeting -->
        <p class="greeting">Welcome to <span class="brand-name">iAyos</span> Agency Network!</p>
        
        <!-- Main Message Card -->
        <div class="message-card">
          <p class="message-text">
            Thank you for registering <span class="agency-highlight">${b}</span> with 
            <span class="brand-name">iAyos</span>. To complete your agency setup and start accessing 
            contract opportunities, please verify your business email address.
          </p>
          
          <p class="message-text">
            Click the button below to verify your agency email and activate your account:
          </p>
          
          <!-- Verification Button -->
          <a href="${a}" class="verify-button">
            Verify Agency Email
          </a>
          
          <!-- Security Note -->
          <div class="security-note">
            <p><span class="font-semibold">Security Notice:</span> This verification link will expire in 30 minutes for your security.</p>
          </div>
        </div>
        
        <!-- Alternative Link Section -->
        <div class="alternative-link">
          <p class="alternative-text">If the button doesn't work, copy and paste this link into your browser:</p>
          <div class="link-display">
            <p class="link-text">${a}</p>
          </div>
        </div>
        
        <!-- Help Section -->
        <div class="help-section">
          <p class="help-title">What happens after verification?</p>
          <ul class="help-list">
            <li>Access to your agency dashboard</li>
            <li>Browse available contract opportunities</li>
            <li>Submit proposals to potential clients</li>
            <li>Manage your agency profile and portfolio</li>
            <li>Track project progress and payments</li>
          </ul>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This email was sent to you because you registered an agency account with iAyos.
          </p>
          <p class="footer-text">
            If you didn't create this account, please ignore this email.
          </p>
          <div class="footer-links">
            <a href="${process.env.NEXTAUTH_URL}/help">Help Center</a>
            <a href="${process.env.NEXTAUTH_URL}/contact">Contact Support</a>
            <a href="${process.env.NEXTAUTH_URL}/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `}({verificationLink:m,businessName:g});return await (0,A.Z)(l?.email,"Agency Email Verification - iAyos",n),new Response(JSON.stringify({success:!0,message:"Email Verification Sent"}),{status:201})}catch(a){if(console.error("Registration error:",a),await u.z.$disconnect(),a?.code==="P2002")return new Response(JSON.stringify({error:"Email already registered"}),{status:409});if(a?.code==="P1001")return console.error("Database connection failed"),new Response(JSON.stringify({error:"Database connection failed. Please try again later."}),{status:503});if(a?.message?.includes("Invalid `prisma"))return console.error("Prisma configuration error:",a.message),new Response(JSON.stringify({error:"Database configuration error"}),{status:500});if(a?.message?.includes("send"))return console.error("Email sending failed:",a.message),new Response(JSON.stringify({error:"Registration successful but email verification failed. Please try logging in."}),{status:207});return new Response(JSON.stringify({error:"Registration failed"}),{status:500})}finally{await u.z.$disconnect()}}let E=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/auth/register/agency/route",pathname:"/api/auth/register/agency",filename:"route",bundlePath:"app/api/auth/register/agency/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\code\\iayos\\apps\\frontend_web\\app\\api\\auth\\register\\agency\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:F,workUnitAsyncStorage:G,serverHooks:H}=E;function I(){return(0,g.patchFetch)({workAsyncStorage:F,workUnitAsyncStorage:G})}async function J(a,b,c){var d;let e="/api/auth/register/agency/route";"/index"===e&&(e="/");let g=await E.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,D=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[D]||y.routes[C]);if(F&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||E.isDev||x||(G="/index"===(G=C)?"/":G);let H=!0===E.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>E.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>E.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await E.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await E.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(L||b instanceof s.NoFallbackError||await E.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},51455:a=>{"use strict";a.exports=require("node:fs/promises")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78474:a=>{"use strict";a.exports=require("node:events")},79551:a=>{"use strict";a.exports=require("url")},79646:a=>{"use strict";a.exports=require("child_process")},80408:()=>{},81630:a=>{"use strict";a.exports=require("http")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},87032:()=>{},90507:(a,b,c)=>{"use strict";c.d(b,{Z:()=>e});var d=c(51448);async function e(a,b,c){let e=d.createTransport({host:"smtp.resend.com",port:465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),f={from:process.env.SMTP_EMAIL_FROM,to:a,subject:b,html:c};return e.sendMail(f)}},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")},96330:a=>{"use strict";a.exports=require("@prisma/client")}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[8819,9535,5314,1448,6555],()=>b(b.s=30213));module.exports=c})();