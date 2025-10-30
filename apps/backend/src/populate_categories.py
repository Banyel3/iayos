"""
Script to populate job categories with detailed information
Based on the frontend job-categories.ts file
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Specializations

# Categories data from frontend
CATEGORIES_DATA = [
    {
        "name": "Plumbing",
        "description": "Pipe installation, repair, leak fixing, and water system maintenance",
        "minimumRate": 150,
        "rateType": "hourly",
        "skillLevel": "intermediate",
        "averageProjectCostMin": 500,
        "averageProjectCostMax": 5000,
    },
    {
        "name": "Electrical",
        "description": "Wiring, electrical panel installation, lighting, and repairs",
        "minimumRate": 175,
        "rateType": "hourly",
        "skillLevel": "intermediate",
        "averageProjectCostMin": 800,
        "averageProjectCostMax": 8000,
    },
    {
        "name": "Carpentry",
        "description": "Furniture making, cabinet installation, door/window repair, and woodwork",
        "minimumRate": 140,
        "rateType": "hourly",
        "skillLevel": "intermediate",
        "averageProjectCostMin": 1000,
        "averageProjectCostMax": 15000,
    },
    {
        "name": "Home Cleaning",
        "description": "Residential cleaning, deep cleaning, and housekeeping services",
        "minimumRate": 85,
        "rateType": "hourly",
        "skillLevel": "entry",
        "averageProjectCostMin": 300,
        "averageProjectCostMax": 2000,
    },
    {
        "name": "HVAC",
        "description": "AC installation, repair, maintenance, and ventilation systems",
        "minimumRate": 200,
        "rateType": "hourly",
        "skillLevel": "expert",
        "averageProjectCostMin": 1500,
        "averageProjectCostMax": 10000,
    },
    {
        "name": "Painting",
        "description": "Interior/exterior painting, wall finishing, and surface preparation",
        "minimumRate": 120,
        "rateType": "hourly",
        "skillLevel": "intermediate",
        "averageProjectCostMin": 800,
        "averageProjectCostMax": 8000,
    },
    {
        "name": "Masonry",
        "description": "Brickwork, concrete work, tile installation, and stonework",
        "minimumRate": 130,
        "rateType": "hourly",
        "skillLevel": "intermediate",
        "averageProjectCostMin": 1500,
        "averageProjectCostMax": 20000,
    },
    {
        "name": "Welding",
        "description": "Metal fabrication, gate repair, structural welding",
        "minimumRate": 180,
        "rateType": "hourly",
        "skillLevel": "expert",
        "averageProjectCostMin": 1000,
        "averageProjectCostMax": 12000,
    },
    {
        "name": "Cleaning",
        "description": "General cleaning services for residential and commercial properties",
        "minimumRate": 80,
        "rateType": "hourly",
        "skillLevel": "entry",
        "averageProjectCostMin": 250,
        "averageProjectCostMax": 1500,
    },
    {
        "name": "Gardening",
        "description": "Lawn care, landscaping, tree trimming, and garden maintenance",
        "minimumRate": 90,
        "rateType": "hourly",
        "skillLevel": "entry",
        "averageProjectCostMin": 400,
        "averageProjectCostMax": 3000,
    },
    {
        "name": "Moving",
        "description": "Residential and commercial moving services, packing, and transport",
        "minimumRate": 100,
        "rateType": "hourly",
        "skillLevel": "entry",
        "averageProjectCostMin": 500,
        "averageProjectCostMax": 5000,
    },
    {
        "name": "Appliance Repair",
        "description": "Repair and maintenance of household appliances",
        "minimumRate": 160,
        "rateType": "hourly",
        "skillLevel": "intermediate",
        "averageProjectCostMin": 600,
        "averageProjectCostMax": 4000,
    },
]


def populate_categories():
    """Update existing categories and create new ones with full details"""
    
    updated_count = 0
    created_count = 0
    
    for category_data in CATEGORIES_DATA:
        # Try to find existing category by name
        category, created = Specializations.objects.update_or_create(
            specializationName=category_data["name"],
            defaults={
                "description": category_data["description"],
                "minimumRate": category_data["minimumRate"],
                "rateType": category_data["rateType"],
                "skillLevel": category_data["skillLevel"],
                "averageProjectCostMin": category_data["averageProjectCostMin"],
                "averageProjectCostMax": category_data["averageProjectCostMax"],
            }
        )
        
        if created:
            created_count += 1
            print(f"✓ Created: {category.specializationName}")
        else:
            updated_count += 1
            print(f"✓ Updated: {category.specializationName}")
    
    print(f"\n=== Summary ===")
    print(f"Created: {created_count} categories")
    print(f"Updated: {updated_count} categories")
    print(f"Total: {Specializations.objects.count()} categories in database")


if __name__ == "__main__":
    print("Populating job categories...\n")
    populate_categories()
    print("\nDone!")
