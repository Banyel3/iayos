"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/form_button";

interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  tagName: string;
}

export default function DownloadAppPage() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        // First try to fetch from backend /api/mobile/config
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://iayos.onrender.com';
        try {
          const configResponse = await fetch(`${backendUrl}/api/mobile/config`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          
          if (configResponse.ok) {
            const config = await configResponse.json();
            if (config.version?.current_version && config.version?.download_url) {
              setRelease({
                version: config.version.current_version,
                downloadUrl: config.version.download_url,
                tagName: `mobile-v${config.version.current_version}`,
              });
              setLoading(false);
              return;
            }
          }
        } catch (backendError) {
          console.warn('Backend config fetch failed, falling back to GitHub API:', backendError);
        }

        // Fallback: Fetch from GitHub API directly
        const response = await fetch(
          'https://api.github.com/repos/Banyel3/iayos/releases/latest',
          {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const tagName = data.tag_name || 'mobile-v1.8.11';
        const version = tagName.replace('mobile-v', '');
        
        // Find APK asset
        let downloadUrl = `https://github.com/Banyel3/iayos/releases/download/${tagName}/iayos-${version}.apk`;
        for (const asset of data.assets || []) {
          if (asset.name?.endsWith('.apk')) {
            downloadUrl = asset.browser_download_url;
            break;
          }
        }

        setRelease({ version, downloadUrl, tagName });
      } catch (err) {
        console.error('Failed to fetch release info:', err);
        setError('Failed to fetch latest version');
        // Use fallback values
        setRelease({
          version: '1.8.11',
          downloadUrl: 'https://github.com/Banyel3/iayos/releases/latest',
          tagName: 'mobile-v1.8.11',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLatestRelease();
  }, []);

  // Generate QR code URL dynamically
  const qrCodeUrl = release
    ? `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(release.downloadUrl)}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="iAyos"
              width={140}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Download the Mobile App
              </h1>
              <p className="text-gray-600">
                Workers and Clients must use our mobile app to register and
                access iAyos.
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                {loading ? (
                  <div className="w-[192px] h-[192px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : qrCodeUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrCodeUrl}
                    alt="Download iAyos APK"
                    width={192}
                    height={192}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-[192px] h-[192px] flex items-center justify-center text-gray-400">
                    QR Code
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <a
              href={release?.downloadUrl || 'https://github.com/Banyel3/iayos/releases/latest'}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-4"
            >
              <Button 
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Download APK (Android)
              </Button>
            </a>

            <p className="text-center text-sm text-gray-500">
              {loading ? (
                'Loading version...'
              ) : error ? (
                <span className="text-amber-600">v{release?.version || '?'} • Using fallback</span>
              ) : (
                <>v{release?.version} • Latest Release</>
              )}
            </p>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
