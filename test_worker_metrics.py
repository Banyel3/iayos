"""
Test Worker Detail API - New Metrics Verification
Tests that completion rate and rating breakdown are returned
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_worker_detail_metrics():
    """Test worker detail endpoint for new metrics"""
    
    # Test with worker ID 2 (KYC verified, should have data)
    worker_id = 2
    
    print(f"\n{'='*60}")
    print(f"Testing Worker Detail API - Worker ID: {worker_id}")
    print(f"{'='*60}\n")
    
    try:
        # Make request to worker detail endpoint
        url = f"{BASE_URL}/api/mobile/workers/{worker_id}"
        print(f"📡 Requesting: {url}\n")
        
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if new metrics are present
            new_metrics = [
                'completionRate',
                'qualityRating',
                'communicationRating',
                'professionalismRating',
                'timelinessRating'
            ]
            
            print(f"\n{'='*60}")
            print("✅ API Response Successful!")
            print(f"{'='*60}\n")
            
            # Display worker info
            print(f"👤 Worker: {data.get('firstName', 'N/A')} {data.get('lastName', 'N/A')}")
            print(f"📊 Overall Rating: {data.get('rating', 0):.1f} ({data.get('reviewCount', 0)} reviews)")
            print(f"💼 Completed Jobs: {data.get('completedJobs', 0)}")
            
            print(f"\n{'─'*60}")
            print("📈 NEW METRICS:")
            print(f"{'─'*60}\n")
            
            # Check each new metric
            all_present = True
            for metric in new_metrics:
                if metric in data:
                    value = data[metric]
                    if metric == 'completionRate':
                        print(f"✅ {metric}: {value}%")
                    else:
                        print(f"✅ {metric}: {value}/5.0")
                else:
                    print(f"❌ {metric}: MISSING")
                    all_present = False
            
            if all_present:
                print(f"\n{'='*60}")
                print("🎉 SUCCESS! All new metrics are present in the response")
                print(f"{'='*60}\n")
                
                # Display rating breakdown
                if data.get('reviewCount', 0) > 0:
                    print("📊 Rating Breakdown:")
                    print(f"  Quality:        {'⭐' * int(data.get('qualityRating', 0))} ({data.get('qualityRating', 0):.1f})")
                    print(f"  Communication:  {'⭐' * int(data.get('communicationRating', 0))} ({data.get('communicationRating', 0):.1f})")
                    print(f"  Professionalism:{'⭐' * int(data.get('professionalismRating', 0))} ({data.get('professionalismRating', 0):.1f})")
                    print(f"  Timeliness:     {'⭐' * int(data.get('timelinessRating', 0))} ({data.get('timelinessRating', 0):.1f})")
            else:
                print(f"\n{'='*60}")
                print("⚠️  WARNING: Some metrics are missing!")
                print(f"{'='*60}\n")
            
            # Show certifications and materials counts
            cert_count = len(data.get('certifications', []))
            mat_count = len(data.get('materials', []))
            print(f"\n📜 Certifications: {cert_count}")
            print(f"🧰 Materials: {mat_count}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to backend server")
        print("Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    test_worker_detail_metrics()
