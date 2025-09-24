(()=>{var a={};a.id=1612,a.ids=[1612],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1183:(a,b,c)=>{var d={"./BurstyRateLimiter":[97090,7],"./BurstyRateLimiter.js":[97090,7],"./ExpressBruteFlexible":[39388,7,9388],"./ExpressBruteFlexible.js":[39388,7,9388],"./RLWrapperBlackAndWhite":[71325,7],"./RLWrapperBlackAndWhite.js":[71325,7],"./RateLimiterAbstract":[79915,7],"./RateLimiterAbstract.js":[79915,7],"./RateLimiterCluster":[95039,7],"./RateLimiterCluster.js":[95039,7],"./RateLimiterDrizzle":[74307,7],"./RateLimiterDrizzle.js":[74307,7],"./RateLimiterDrizzleNonAtomic":[80321,7],"./RateLimiterDrizzleNonAtomic.js":[80321,7],"./RateLimiterDynamo":[73455,7],"./RateLimiterDynamo.js":[73455,7],"./RateLimiterEtcd":[67287,7],"./RateLimiterEtcd.js":[67287,7],"./RateLimiterEtcdNonAtomic":[60445,7],"./RateLimiterEtcdNonAtomic.js":[60445,7],"./RateLimiterMemcache":[29880,7],"./RateLimiterMemcache.js":[29880,7],"./RateLimiterMemory":[14490,7],"./RateLimiterMemory.js":[14490,7],"./RateLimiterMongo":[73929,7],"./RateLimiterMongo.js":[73929,7],"./RateLimiterMySQL":[4195,7],"./RateLimiterMySQL.js":[4195,7],"./RateLimiterPostgres":[17962,7],"./RateLimiterPostgres.js":[17962,7],"./RateLimiterPrisma":[84153,7],"./RateLimiterPrisma.js":[84153,7],"./RateLimiterQueue":[62986,7],"./RateLimiterQueue.js":[62986,7],"./RateLimiterRedis":[40902,7],"./RateLimiterRedis.js":[40902,7],"./RateLimiterRes":[46423,7],"./RateLimiterRes.js":[46423,7],"./RateLimiterSQLite":[70957,7],"./RateLimiterSQLite.js":[70957,7],"./RateLimiterStoreAbstract":[78950,7],"./RateLimiterStoreAbstract.js":[78950,7],"./RateLimiterUnion":[74038,7],"./RateLimiterUnion.js":[74038,7],"./RateLimiterValkey":[23011,7],"./RateLimiterValkey.js":[23011,7],"./RateLimiterValkeyGlide":[65534,7],"./RateLimiterValkeyGlide.js":[65534,7],"./component/BlockedKeys":[17284,7],"./component/BlockedKeys/":[17284,7],"./component/BlockedKeys/BlockedKeys":[67732,7],"./component/BlockedKeys/BlockedKeys.js":[67732,7],"./component/BlockedKeys/index":[17284,7],"./component/BlockedKeys/index.js":[17284,7],"./component/MemoryStorage":[76016,7,6016],"./component/MemoryStorage/":[76016,7,6016],"./component/MemoryStorage/MemoryStorage":[22568,7],"./component/MemoryStorage/MemoryStorage.js":[22568,7],"./component/MemoryStorage/Record":[11239,7],"./component/MemoryStorage/Record.js":[11239,7],"./component/MemoryStorage/index":[76016,7,6016],"./component/MemoryStorage/index.js":[76016,7,6016],"./component/RateLimiterEtcdTransactionFailedError":[41914,7],"./component/RateLimiterEtcdTransactionFailedError.js":[41914,7],"./component/RateLimiterQueueError":[67806,7],"./component/RateLimiterQueueError.js":[67806,7],"./component/RateLimiterSetupError":[52092,7],"./component/RateLimiterSetupError.js":[52092,7],"./component/index.d":[67643,1,7643],"./component/index.d.ts":[67643,1,7643],"./constants":[33074,7,3074],"./constants.js":[33074,7,3074],"./index.d":[3995,1,3995],"./index.d.ts":[3995,1,3995]};function e(a){if(!c.o(d,a))return Promise.resolve().then(()=>{var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b});var b=d[a],e=b[0];return Promise.all(b.slice(2).map(c.e)).then(()=>c.t(e,16|b[1]))}e.keys=()=>Object.keys(d),e.id=1183,a.exports=e},1708:a=>{"use strict";a.exports=require("node:process")},1759:(a,b,c)=>{"use strict";function d({verificationLink:a}){return`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - iAyos</title>
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
        
        .security-note {
          background-color: #eff6ff;
          border-left: 4px solid #60a5fa;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .security-note p {
          font-size: 0.875rem;
          color: #1d4ed8;
        }
        
        .security-note .font-semibold {
          font-weight: 600;
        }
        
        .verify-button {
          display: inline-block;
          width: auto;
          min-width: 200px;
          background-color: #2563eb;
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
          background-color: #1d4ed8 !important;
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
          color: #2563eb;
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
        
        .footer {
          text-align: center;
        }
        
        .footer-text {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        
        .login-link-section {
          margin-top: 1.5rem;
        }
        
        .login-text {
          text-align: center;
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .login-link {
          color: #3b82f6;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .login-link:hover {
          color: #2563eb;
        }
        
        @media (max-width: 640px) {
          .container {
            padding: 1rem !important;
          }
          
          .email-icon {
            width: 60px !important;
            height: 60px !important;
          }
          
          .email-icon svg {
            width: 36px !important;
            height: 36px !important;
          }
        }
        
        /* Email client specific fixes */
        .email-wrapper {
          width: 100%;
          background-color: #f9fafb;
          padding: 20px 0;
        }
        
        .email-table {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f9fafb;
        }
        
        .content-table {
          width: 100%;
          max-width: 390px;
          margin: 0 auto;
          background-color: transparent;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <table class="email-table" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <table class="content-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="container">
                    <!-- Email Icon -->
                    <div class="email-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>

                    <!-- Main Heading -->
                    <h1 class="main-heading">
                      Verify Your Email Address
                    </h1>

                    <!-- Greeting -->
                    <p class="greeting">
                      Hello!
                    </p>

                    <!-- Main Message -->
                    <div class="message-card">
                      <p class="message-text">
                        Thank you for joining <span class="brand-name">iAyos</span>! 
                        We&apos;re excited to have you on board.
                      </p>
                      
                      <p class="message-text">
                        To complete your registration and secure your account, please 
                        verify your email address by clicking the button below.
                      </p>

                      <div class="security-note">
                        <p>
                          <span class="font-semibold">Security Note:</span> This 
                          verification link will expire in 24 hours for your protection.
                        </p>
                      </div>
                    </div>

                    <!-- Verification Button -->
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${a}" class="verify-button">
                        Verify Email Address →
                      </a>
                    </div>

                    <!-- Alternative Link -->
                    <div class="alternative-link">
                      <p class="alternative-text">
                        Button not working? Copy and paste this link into your browser:
                      </p>
                      <div class="link-display">
                        <span class="link-text">
                          ${a}
                        </span>
                      </div>
                    </div>

                    <!-- Help Section -->
                    <div class="help-section">
                      <h3 class="help-title">
                        Need Help?
                      </h3>
                      <ul class="help-list">
                        <li>• If you didn&apos;t create this account, you can safely ignore this email</li>
                        <li>• Make sure to check your spam/junk folder</li>
                        <li>• Contact support if you continue to have issues</li>
                      </ul>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                      <p class="footer-text">
                        This email was sent from iAyos
                      </p>
                      <p class="footer-text">
                        \xa9 2025 iAyos. All rights reserved.
                      </p>
                    </div>

                    <!-- Backup Login Link -->
                    <div class="login-link-section">
                      <p class="login-text">
                        Already verified? 
                        <a href="/auth/login" class="login-link">
                          Sign in to your account
                        </a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `}function e({resetLink:a}){return`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - iAyos</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div style="max-width: 390px; width: 100%; margin: 0 auto; padding: 32px; text-align: center;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 390px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    
                    <!-- Header Section -->
                    <div style="margin-bottom: 32px;">
                      <h1 style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">iAyos</h1>
                      <p style="font-size: 14px; color: #6b7280; margin: 0;">May sira? May iAyos.</p>
                    </div>

                    <!-- Icon Section -->
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center; font-size: 24px; line-height: 48px;">
                      🔑
                    </div>

                    <!-- Main Content -->
                    <h2 style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 12px 0; text-align: center;">Reset Your Password</h2>
                    
                    <p style="font-size: 16px; color: #4b5563; text-align: center; line-height: 1.625; margin: 0 0 24px 0;">
                      We received a request to reset your password for your <span style="font-weight: 600; color: #f59e0b;">iAyos</span> account. Click the button below to create a new password.
                    </p>

                    <!-- Security Notice -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 16px; margin-bottom: 24px; text-align: left;">
                      <p style="font-size: 14px; color: #92400e; margin: 0;">
                        <span style="font-weight: 600;">🔒 Security Notice:</span> For your protection, this link will expire in 15 minutes. If you didn&apos;t request this password reset, you can safely ignore this email.
                      </p>
                    </div>

                    <!-- Reset Button -->
                    <div style="margin-bottom: 24px;">
                      <a href="${a}" style="display: inline-block; min-width: 200px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white !important; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; text-align: center; font-size: 16px; box-shadow: 0 4px 12px rgba(31, 41, 55, 0.2);">
                        Reset My Password
                      </a>
                    </div>

                    <!-- Alternative Method -->
                    <div style="margin-bottom: 32px; width: 100%;">
                      <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0 0 12px 0;">
                        If the button doesn&apos;t work, copy and paste this link into your browser:
                      </p>
                      <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; word-break: break-all;">
                        <span style="font-size: 12px; color: #2563eb;">${a}</span>
                      </div>
                    </div>

                    <!-- Help Section -->
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; width: 100%; margin-bottom: 24px; text-align: left;">
                      <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Need Help?</h3>
                      <ul style="list-style: none; font-size: 14px; color: #4b5563; margin: 0; padding: 0;">
                        <li style="margin-bottom: 4px;">• Password must be at least 6 characters</li>
                        <li style="margin-bottom: 4px;">• Use a mix of letters, numbers, and symbols</li>
                        <li style="margin-bottom: 4px;">• Don&apos;t use personal information</li>
                      </ul>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">
                        This email was sent from iAyos
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">
                        \xa9 2025 iAyos. All rights reserved.
                      </p>
                    </div>

                    <!-- Login Link -->
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0;">
                        Remember your password? 
                        <a href="/auth/login" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                          Sign in to your account
                        </a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `}c.d(b,{k2:()=>d,zA:()=>e})},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5321:(a,b,c)=>{"use strict";c.d(b,{x:()=>d});let d=new(c(39535)).RateLimiterMemory({points:3,duration:300})},5486:a=>{"use strict";a.exports=require("bcrypt")},7066:a=>{"use strict";a.exports=require("node:tty")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14985:a=>{"use strict";a.exports=require("dns")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21820:a=>{"use strict";a.exports=require("os")},27172:a=>{"use strict";a.exports=require("cluster")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},51455:a=>{"use strict";a.exports=require("node:fs/promises")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78474:a=>{"use strict";a.exports=require("node:events")},79551:a=>{"use strict";a.exports=require("url")},79646:a=>{"use strict";a.exports=require("child_process")},80408:()=>{},81630:a=>{"use strict";a.exports=require("http")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},87032:()=>{},89216:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>L,patchFetch:()=>K,routeModule:()=>G,serverHooks:()=>J,workAsyncStorage:()=>H,workUnitAsyncStorage:()=>I});var d={};c.r(d),c.d(d,{POST:()=>F});var e=c(26421),f=c(97714),g=c(85681),h=c(22369),i=c(37587),j=c(261),k=c(46537),l=c(3463),m=c(1889),n=c(85250),o=c(23620),p=c(29790),q=c(67876),r=c(57749),s=c(86439),t=c(40139),u=c(66555),v=c(75314),w=c(5486),x=c.n(w),y=c(55511),z=c.n(y),A=c(90507),B=c(1759),C=c(5321),D=c(53444);let E=v.Ikc({email:v.YjP().email(),password:v.YjP().min(6),firstName:v.YjP(),lastName:v.YjP(),contactNum:v.YjP().optional(),birthDate:v.YjP().min(1,"Date of birth is required").refine(a=>{let b=new Date(a),c=new Date,d=c.getFullYear()-b.getFullYear(),e=c.getMonth()-b.getMonth();return e<0||0===e&&c.getDate()<b.getDate()?d-1>=18:d>=18},"You must be at least 18 years old to register")});async function F(a){try{let b=a.headers.get("x-forwarded-for")||"anonymous";try{C.x.consume(b)}catch{return D.NextResponse.json({success:!1,message:"Too many requests. Try again later."},{status:429})}let c=await a.json(),d=E.safeParse(c);if(!d.success)return new Response(JSON.stringify({error:d.error}),{status:400});let{email:e,password:f,firstName:g,lastName:h,contactNum:i,birthDate:j}=d.data;if(await u.z.accounts.findUnique({where:{email:e}}))return new Response(JSON.stringify({error:"User with this email already exists"}),{status:409});let k=await x().hash(f,10),l=z().randomBytes(20).toString("hex"),m=z().createHash("sha256").update(l).digest("hex"),n=new Date(Date.now()+18e5),o=await u.z.accounts.create({data:{email:e,password:k,isVerified:!1,status:"ACTIVE",verifyToken:m,verifyTokenExpire:n,profile:{create:{firstName:g,lastName:h,contactNum:i||"",birthDate:new Date(j)}}}}),p=`${process.env.NEXTAUTH_URL}/auth/verify-email?verifyToken=${l}&id=${o.accountID}`,q=(0,B.k2)({verificationLink:p});return(0,A.Z)(o?.email,"Email Verification",q).catch(console.error),new Response(JSON.stringify("Email Verification Sent"),{status:201})}catch(a){if(console.error("Registration error:",a),a?.code==="P2002")return new Response(JSON.stringify({error:"Email already registered"}),{status:409});return new Response(JSON.stringify({error:"Registration failed"}),{status:500})}}let G=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/auth/register/route",pathname:"/api/auth/register",filename:"route",bundlePath:"app/api/auth/register/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\code\\iayos\\apps\\frontend_web\\app\\api\\auth\\register\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:H,workUnitAsyncStorage:I,serverHooks:J}=G;function K(){return(0,g.patchFetch)({workAsyncStorage:H,workUnitAsyncStorage:I})}async function L(a,b,c){var d;let e="/api/auth/register/route";"/index"===e&&(e="/");let g=await G.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,D=(0,j.normalizeAppPath)(e),E=!!(y.dynamicRoutes[D]||y.routes[C]);if(E&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let F=null;!E||G.isDev||x||(F="/index"===(F=C)?"/":F);let H=!0===G.isDev||!E,I=E&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>G.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>G.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!E)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await G.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await G.handleResponse({req:a,nextConfig:w,cacheKey:F,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!E)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&E||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(L||b instanceof s.NoFallbackError||await G.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),E)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},90507:(a,b,c)=>{"use strict";c.d(b,{Z:()=>e});var d=c(51448);async function e(a,b,c){let e=d.createTransport({host:"smtp.resend.com",port:465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),f={from:process.env.SMTP_EMAIL_FROM,to:a,subject:b,html:c};return e.sendMail(f)}},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")},96330:a=>{"use strict";a.exports=require("@prisma/client")}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[8819,2289,9535,8825,5314,1448,6555],()=>b(b.s=89216));module.exports=c})();