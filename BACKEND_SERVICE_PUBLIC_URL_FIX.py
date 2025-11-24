# SIMPLER FIX - Use public URLs instead of signed URLs
# The issue is Supabase signed URLs are malformed
# Since KYC images need to be viewable by admins anyway, public URLs work

def review_kyc_items(request):
    import json
    
    print("DEBUG: review_kyc_items called - using PUBLIC URLs")
    
    # Parse JSON body from request
    try:
        body = json.loads(request.body.decode('utf-8'))
        print(f"DEBUG: Request body: {body}")
    except Exception as e:
        print(f"ERROR: Error parsing request body: {str(e)}")
        raise
    
    front_id_link = body.get("frontIDLink")
    back_id_link = body.get("backIDLink")
    clearance_link = body.get("clearanceLink")
    selfie_link = body.get("selfieLink")

    print(f"DEBUG: File paths received:")
    print(f"  - frontIDLink: {front_id_link}")
    print(f"  - backIDLink: {back_id_link}")
    print(f"  - clearanceLink: {clearance_link}")
    print(f"  - selfieLink: {selfie_link}")

    # Create public URLs (much simpler and more reliable)
    urls = {}
    
    try:
        def _get_public_url(bucket_name, path):
            """Get public URL for a file in Supabase storage."""
            try:
                if not path:
                    return ""
                    
                print(f"DEBUG: Getting public URL for bucket='{bucket_name}', path='{path}'")
                public_url = settings.SUPABASE.storage().from_(bucket_name).get_public_url(path)
                print(f"DEBUG: Public URL: {public_url}")
                return public_url
                
            except Exception as e:
                print(f"ERROR: Failed to get public URL for {bucket_name}:{path} - {e}")
                import traceback
                traceback.print_exc()
                return ""

        def _resolve_link(link, default_bucket="kyc-docs"):
            """Convert storage path to public URL."""
            if not link:
                return ""
                
            # If it's already a full URL, return it
            if isinstance(link, str) and (link.startswith('http://') or link.startswith('https://')):
                print(f"DEBUG: Link is already a full URL: {link}")
                return link
            
            # If it's a dict with bucket and path
            if isinstance(link, dict):
                bucket = link.get('bucket') or default_bucket
                path = link.get('path')
            else:
                # It's a storage path string
                path = link
                # Infer bucket from path prefix
                if isinstance(path, str) and path.startswith('agency_'):
                    bucket = 'agency'
                else:
                    bucket = default_bucket

            return _get_public_url(bucket, path)
                    
        # Convert each file path to public URL
        urls["frontIDLink"] = _resolve_link(front_id_link, default_bucket="kyc-docs") if front_id_link else ""
        urls["backIDLink"] = _resolve_link(back_id_link, default_bucket="kyc-docs") if back_id_link else ""
        urls["clearanceLink"] = _resolve_link(clearance_link, default_bucket="kyc-docs") if clearance_link else ""
        urls["selfieLink"] = _resolve_link(selfie_link, default_bucket="kyc-docs") if selfie_link else ""
        
        # Support addressProofLink if frontend sends it
        address_link = body.get("addressProofLink")
        urls["addressProofLink"] = _resolve_link(address_link, default_bucket="kyc-docs") if address_link else ""

        print(f"SUCCESS: Final public URLs:")
        for key, url in urls.items():
            if url:
                print(f"  - {key}: {url}")

        return urls
        
    except Exception as e:
        print(f"ERROR: Error creating public URLs: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
