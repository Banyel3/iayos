# FIXED VERSION OF review_kyc_items function
# Replace lines 202-290 in apps/backend/src/adminpanel/service.py

def review_kyc_items(request):
    import json
    
    print("DEBUG: review_kyc_items called")
    
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

    # Create signed URLs only for files that exist
    urls = {}
    
    try:
        def _create_signed(bucket_name, path):
            """
            Create a signed URL for a file in Supabase storage.
            Returns the signed URL string directly.
            """
            try:
                print(f"DEBUG: Creating signed URL for bucket='{bucket_name}', path='{path}'")
                
                # Supabase Python client returns a dict like:
                # {'signedURL': 'https://...full-url-here...'}
                result = settings.SUPABASE.storage.from_(bucket_name).create_signed_url(path, expires_in=60 * 60)
                
                print(f"DEBUG: Supabase result type: {type(result)}")
                print(f"DEBUG: Supabase result value: {result}")
                
                # Extract the signed URL from the result
                if isinstance(result, dict):
                    signed_url = result.get('signedURL') or result.get('signed_url') or result.get('signedUrl')
                    print(f"DEBUG: Extracted signed URL: {signed_url}")
                    return signed_url
                elif isinstance(result, str):
                    print(f"DEBUG: Result is already a string: {result}")
                    return result
                else:
                    print(f"ERROR: Unexpected result type from Supabase: {type(result)}")
                    return None
                    
            except Exception as e:
                print(f"ERROR: Error creating signed URL for {bucket_name}:{path}")
                print(f"ERROR: Exception: {e}")
                import traceback
                traceback.print_exc()
                return None

        def _resolve_link(link, default_bucket="kyc-docs"):
            """
            Accept either a string path (assume default_bucket) or a dict {bucket, path}.
            Returns signed URL string or empty string on failure.
            """
            if not link:
                return ""
                
            # If it's a mapping, expect {'bucket': 'agency', 'path': 'agency_1/kyc/file.pdf'}
            if isinstance(link, dict):
                bucket = link.get('bucket') or default_bucket
                path = link.get('path')
            else:
                # If it's a full URL, return it directly (assume already accessible)
                if isinstance(link, str) and (link.startswith('http://') or link.startswith('https://')):
                    print(f"DEBUG: Link is already a full URL: {link}")
                    return link

                # It's a storage path string. Try to infer bucket from path prefix.
                path = link
                if isinstance(path, str) and path.startswith('agency_'):
                    bucket = 'agency'
                else:
                    bucket = default_bucket

            if not path:
                return ""

            print(f"DEBUG: Resolving link - bucket={bucket}, path={path}")
            signed_url = _create_signed(bucket, path)
            
            if signed_url:
                print(f"DEBUG: Successfully resolved signed URL: {signed_url}")
                return signed_url
            else:
                # Fallback to public URL if signed URL fails
                print(f"WARN: Signed URL failed, trying public URL")
                try:
                    public_url = settings.SUPABASE.storage.from_(bucket).get_public_url(path)
                    print(f"DEBUG: Public URL: {public_url}")
                    return public_url
                except Exception as e:
                    print(f"ERROR: Public URL also failed: {e}")
                    return ""
                    
        # Use _resolve_link for each incoming field
        urls["frontIDLink"] = _resolve_link(front_id_link, default_bucket="kyc-docs") if front_id_link else ""
        urls["backIDLink"] = _resolve_link(back_id_link, default_bucket="kyc-docs") if back_id_link else ""
        urls["clearanceLink"] = _resolve_link(clearance_link, default_bucket="kyc-docs") if clearance_link else ""
        urls["selfieLink"] = _resolve_link(selfie_link, default_bucket="kyc-docs") if selfie_link else ""
        
        # Support addressProofLink if frontend sends it
        address_link = body.get("addressProofLink")
        urls["addressProofLink"] = _resolve_link(address_link, default_bucket="kyc-docs") if address_link else ""

        print(f"SUCCESS: Final URLs returned:")
        for key, url in urls.items():
            if url:
                print(f"  - {key}: {url[:100]}..." if len(url) > 100 else f"  - {key}: {url}")

        return urls
        
    except Exception as e:
        print(f"ERROR: Error creating signed URLs: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
