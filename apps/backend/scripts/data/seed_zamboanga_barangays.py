"""
Seed Zamboanga City and its barangays into the database
Run this script after creating and applying the migration
"""

import os
import sys
import django

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import City, Barangay

def seed_zamboanga_data():
    """
    Seed Zamboanga City and all its barangays
    """
    print("🌱 Starting Zamboanga City data seeding...")
    
    # Create or get Zamboanga City
    city, created = City.objects.get_or_create(
        name='Zamboanga City',
        defaults={
            'province': 'Zamboanga Peninsula',
            'region': 'Region IX',
            'zipCode': '7000'
        }
    )
    
    if created:
        print(f"✅ Created city: {city.name}")
    else:
        print(f"ℹ️  City already exists: {city.name}")
    
    # All 98 barangays of Zamboanga City
    barangays = [
        'Arena Blanco', 'Ayala', 'Baliwasan', 'Baluno', 'Boalan',
        'Bolong', 'Buenavista', 'Bunguiao', 'Busay', 'Cabaluay',
        'Cabatangan', 'Cacao', 'Calabasa', 'Calarian', 'Camino Nuevo',
        'Campo Islam', 'Canelar', 'Capisan', 'Cawit', 'Culianan',
        'Curuan', 'Dita', 'Divisoria', 'Dulian', 'Guisao',
        'Guiwan', 'Kasanyangan', 'La Paz', 'Labuan', 'Lamisahan',
        'Landang Gua', 'Landang Laum', 'Lanzones', 'Lapakan', 'Latuan',
        'Licomo', 'Limaong', 'Limpapa', 'Lubigan', 'Lumayang',
        'Lumbangan', 'Lunzuran', 'Maasin', 'Malagutay', 'Mampang',
        'Manalipa', 'Mangusu', 'Manicahan', 'Mariki', 'Mercedes',
        'Muti', 'Pamucutan', 'Pangapuyan', 'Panubigan', 'Pasilmanta',
        'Pasobolong', 'Pasonanca', 'Patalon', 'Paulan', 'Pilar',
        'Pitogo', 'Putik', 'Quiniput', 'Recodo', 'Rio Hondo',
        'Salaan', 'San Jose Cawa-cawa', 'San Jose Gusu', 'San Roque',
        'Sangali', 'Santa Barbara', 'Santa Catalina', 'Santa Maria',
        'Santo Niño', 'Sibulao', 'Sinubung', 'Sinunoc', 'Tagasilay',
        'Taguiti', 'Talabaan', 'Talisayan', 'Taluksangay', 'Talon-talon',
        'Tetuan', 'Tictapul', 'Tigbalabag', 'Tigtabon', 'Tolosa',
        'Tulungatung', 'Tumaga', 'Tumalutab', 'Tumitus', 'Victoria',
        'Vitali', 'Zambowood', 'Zone I', 'Zone II', 'Zone III',
        'Zone IV'
    ]
    
    created_count = 0
    existing_count = 0
    
    for barangay_name in barangays:
        barangay, created = Barangay.objects.get_or_create(
            name=barangay_name,
            city=city,
            defaults={
                'zipCode': '7000'
            }
        )
        
        if created:
            created_count += 1
            print(f"  ✅ Created: {barangay_name}")
        else:
            existing_count += 1
            print(f"  ℹ️  Already exists: {barangay_name}")
    
    print(f"\n📊 Summary:")
    print(f"   City: {city.name}")
    print(f"   Total barangays: {len(barangays)}")
    print(f"   Newly created: {created_count}")
    print(f"   Already existing: {existing_count}")
    print(f"\n✅ Seeding completed successfully!")

if __name__ == '__main__':
    try:
        seed_zamboanga_data()
    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
