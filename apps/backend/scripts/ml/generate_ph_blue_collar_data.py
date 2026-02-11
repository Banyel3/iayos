#!/usr/bin/env python3
"""
Generate synthetic Philippine blue-collar job data for ML training.
Creates 500+ samples across 18 job categories with realistic pricing.
"""

import csv
import random
from pathlib import Path
from typing import List, Dict, Tuple

# Philippine cities/regions
PH_CITIES = [
    "Zamboanga City", "Manila", "Cebu City", "Davao City", "Makati City",
    "Quezon City", "Pasig City", "Taguig City", "Caloocan City", "Las Pinas City",
    "Marikina City", "Muntinlupa City", "Paranaque City", "Pasay City", "San Juan City",
    "Mandaluyong City", "Valenzuela City", "Navotas City", "Malabon City", "Antipolo City"
]

# Job categories with realistic Philippine pricing (in PHP)
# Format: (category, job_templates, tags, (min_minor, max_minor), (min_moderate, max_moderate), (min_major, max_major))
CATEGORIES = [
    ("Plumbing", [
        ("Fix leaking faucet", "Kitchen faucet has been dripping for a week. Need someone to fix or replace the washer."),
        ("Install new shower head", "Need to install a new rain shower head in the bathroom."),
        ("Unclog bathroom drain", "Bathroom drain is completely clogged. Water not draining at all."),
        ("Replace toilet flush mechanism", "Toilet tank mechanism broken, need replacement."),
        ("Install water heater", "Need to install electric water heater in bathroom. Includes piping work."),
        ("Fix pipe leak under sink", "Water leaking from pipe under kitchen sink. Creating water damage."),
        ("Install bidet spray", "Need to install bidet spray attachment to existing toilet."),
        ("Septic tank pumping", "Need septic tank emptied and cleaned."),
        ("Full bathroom plumbing renovation", "Complete bathroom plumbing overhaul including new pipes, fixtures, and drainage."),
        ("Water pump installation", "Install water pump for 2-story house to boost water pressure."),
        ("Install water tank", "Need overhead water tank installed on roof with piping."),
        ("Fix toilet leak", "Toilet base is leaking water. Need to reseat and reseal."),
        ("Replace kitchen sink", "Need to replace old kitchen sink with new stainless steel sink."),
        ("Install grease trap", "Commercial kitchen grease trap installation required."),
    ], ["plumbing", "pipes", "water", "fixtures"], (300, 1500), (2000, 8000), (15000, 50000)),
    
    ("Electrical Work", [
        ("Install electrical outlet", "Need to add 2 new electrical outlets in living room."),
        ("Fix flickering lights", "Ceiling lights in bedroom keep flickering. May be wiring issue."),
        ("Install ceiling fan", "Need to install ceiling fan with light in master bedroom."),
        ("Electrical panel upgrade", "Need to upgrade from 30amp to 60amp breaker panel."),
        ("Install doorbell system", "Install wireless doorbell system with camera."),
        ("Rewire old house circuit", "One circuit keeps tripping. Need to rewire entire circuit safely."),
        ("Install CCTV system wiring", "Need electrical wiring for 4-camera CCTV system."),
        ("Generator hookup installation", "Install transfer switch for generator connection."),
        ("Complete house rewiring", "Full house electrical rewiring. Old wires need replacement."),
        ("Install solar panel wiring", "Connect solar panel system to house electrical."),
        ("Install LED lighting", "Replace all fluorescent with LED lighting throughout house."),
        ("Fix power outage issue", "Partial house blackout. Some rooms have no power."),
        ("Install exhaust fan", "Need exhaust fan installed in bathroom with wiring."),
        ("Smart home wiring", "Install wiring for smart home switches and devices."),
    ], ["electrical", "wiring", "power", "installation"], (350, 1500), (3000, 12000), (20000, 60000)),
    
    ("Carpentry", [
        ("Build kitchen cabinet", "Need custom kitchen cabinet 2 meters wide."),
        ("Repair broken door", "Bedroom door hinge broken and door won't close properly."),
        ("Install window frame", "Need new window frame installed in kitchen."),
        ("Build wooden deck", "Build 3x4 meter wooden deck in backyard."),
        ("Repair damaged flooring", "Wooden floor boards damaged from water leak."),
        ("Build closet shelving", "Need custom closet shelving system."),
        ("Install wooden ceiling", "Install wooden ceiling panels in living room."),
        ("Build garden pergola", "Construct wooden pergola in garden area."),
        ("Complete house framing", "Full house wood framing for extension."),
        ("Furniture repair", "Wooden chair needs leg repair and refinishing."),
        ("Build wooden gate", "Need new wooden gate for driveway entrance."),
        ("Install wooden stairs", "Build wooden staircase for 2-story house."),
        ("Build storage shed", "Construct outdoor storage shed 2x3 meters."),
        ("Custom furniture making", "Build custom study table and bookshelf."),
    ], ["carpentry", "wood", "furniture", "construction"], (400, 2000), (4000, 15000), (25000, 100000)),
    
    ("Cleaning", [
        ("Deep clean apartment", "2BR apartment deep cleaning including kitchen and bathrooms."),
        ("Post-construction cleanup", "Clean up after renovation. Dust, debris, and construction waste."),
        ("Move-out cleaning", "Complete cleaning for rental unit turnover."),
        ("Office cleaning", "Daily office cleaning service for office space."),
        ("Upholstery cleaning", "Clean sofas and dining chairs."),
        ("Window cleaning high-rise", "Clean exterior windows condo unit."),
        ("Carpet deep cleaning", "Deep clean carpet in living and bedrooms."),
        ("Regular housekeeping", "Weekly housekeeping service. General cleaning."),
        ("Disinfection service", "Full house disinfection and sanitization."),
        ("Grease cleaning kitchen", "Heavy duty degreasing of commercial kitchen."),
        ("Pool cleaning", "Swimming pool cleaning and maintenance."),
        ("Water tank cleaning", "Clean and sanitize water storage tank."),
        ("Garage cleaning", "Deep clean and organize garage space."),
        ("Aircon cleaning", "Clean and service 3 aircon units."),
    ], ["cleaning", "housekeeping", "sanitization", "maintenance"], (400, 1500), (1500, 4000), (5000, 15000)),
    
    ("HVAC", [
        ("Aircon installation", "Install split-type aircon in bedroom."),
        ("Aircon repair", "Aircon not cooling properly. May need freon refill."),
        ("Clean aircon unit", "Annual cleaning and maintenance of aircon."),
        ("Install exhaust system", "Install kitchen exhaust ventilation system."),
        ("Central AC installation", "Install central air conditioning for house."),
        ("Duct cleaning", "Clean HVAC ducts throughout the house."),
        ("Compressor replacement", "Aircon compressor needs replacement."),
        ("Install ventilation fan", "Install attic ventilation fans."),
        ("Refrigerant recharge", "Aircon needs freon recharge. Low cooling."),
        ("Smart thermostat install", "Install programmable smart thermostat."),
        ("Aircon relocation", "Move aircon unit to different room."),
        ("Multi-split system install", "Install multi-split system for 3 rooms."),
    ], ["HVAC", "aircon", "cooling", "ventilation"], (500, 2000), (3000, 10000), (20000, 150000)),
    
    ("Painting", [
        ("Paint bedroom", "Repaint master bedroom walls. Approximately 20sqm."),
        ("Exterior house painting", "Paint exterior walls of 2-story house."),
        ("Cabinet refinishing", "Sand and repaint kitchen cabinets."),
        ("Fence painting", "Paint concrete fence around property."),
        ("Waterproofing paint", "Apply waterproof paint to roof deck."),
        ("Texture painting", "Apply texture paint to living room wall."),
        ("Interior full house paint", "Complete interior repainting of house."),
        ("Gate and grills painting", "Repaint metal gates and window grills."),
        ("Ceiling painting", "Repaint ceiling in 3 bedrooms."),
        ("Commercial painting", "Paint office interior 100sqm."),
        ("Anti-rust treatment", "Apply anti-rust treatment to metal structures."),
        ("Wall repair and paint", "Patch wall cracks then repaint room."),
    ], ["painting", "repainting", "finishing", "coating"], (800, 3000), (3500, 12000), (15000, 50000)),
    
    ("Masonry", [
        ("Build concrete fence", "Construct 15 meters concrete hollow block fence."),
        ("Repair cracked wall", "Fix large crack in exterior concrete wall."),
        ("Tile installation", "Install floor tiles in bathroom 6sqm."),
        ("Build retaining wall", "Construct retaining wall for sloped property."),
        ("Concrete driveway", "Pour concrete driveway 4x8 meters."),
        ("Fireplace construction", "Build outdoor brick fireplace."),
        ("Steps and stairs", "Build concrete steps to entrance."),
        ("Wall plastering", "Plaster and finish interior walls."),
        ("Swimming pool construction", "Build small swimming pool."),
        ("Foundation repair", "Repair cracked foundation."),
        ("Patio construction", "Build concrete patio 4x4 meters."),
        ("Hollow block laying", "Lay hollow blocks for room addition."),
    ], ["masonry", "concrete", "tiles", "construction"], (1000, 4000), (5000, 20000), (30000, 100000)),
    
    ("Welding", [
        ("Repair metal gate", "Gate hinge broken, needs welding repair."),
        ("Build metal gate", "Fabricate and install new sliding gate."),
        ("Install window grills", "Weld and install security grills on 4 windows."),
        ("Metal roof frame", "Weld steel frame for carport roof."),
        ("Stair railing", "Fabricate and install stair railing."),
        ("Steel trusses", "Weld steel trusses for roof extension."),
        ("Metal fence", "Build tubular steel fence."),
        ("Repair broken grill", "Fix broken window security grill."),
        ("Carport construction", "Build steel carport structure."),
        ("Tank fabrication", "Fabricate steel water tank."),
        ("Steel door frame", "Make and install steel door frame."),
        ("Balcony railing", "Fabricate balcony safety railing."),
    ], ["welding", "metal", "fabrication", "steel"], (400, 2000), (3000, 12000), (15000, 60000)),
    
    ("Home Repair", [
        ("Fix door lock", "Door lock mechanism jammed. Need repair or replacement."),
        ("Repair window", "Window glass cracked, needs replacement."),
        ("Fix drawer slides", "Kitchen drawer slides broken."),
        ("Screen door repair", "Screen door torn and frame bent."),
        ("Doorknob replacement", "Replace 5 interior doorknobs."),
        ("Weather stripping", "Install weather stripping on doors."),
        ("Fix squeaky floor", "Multiple floor boards squeaking."),
        ("Patch drywall hole", "Large hole in drywall needs patching."),
        ("Fix stuck window", "Window won't open, may be painted shut."),
        ("Replace ceiling tiles", "Several ceiling tiles water damaged."),
        ("Install door stopper", "Install door stoppers throughout house."),
        ("Fix cabinet hinges", "Multiple cabinet hinges loose or broken."),
    ], ["repair", "maintenance", "home improvement", "handyman"], (300, 1200), (1500, 5000), (8000, 25000)),
    
    ("Appliance Repair", [
        ("Fix washing machine", "Washing machine not spinning. Makes loud noise."),
        ("Repair refrigerator", "Refrigerator not cooling. Compressor running."),
        ("Fix microwave", "Microwave not heating. Turntable works."),
        ("Repair gas stove", "Gas stove igniter not working."),
        ("Fix TV", "LCD TV has lines on screen."),
        ("Repair water dispenser", "Water dispenser not heating water."),
        ("Fix electric fan", "Electric fan not rotating. Motor issue."),
        ("Repair rice cooker", "Rice cooker not heating properly."),
        ("Fix aircon", "Aircon compressor not starting."),
        ("Repair oven", "Electric oven not reaching temperature."),
        ("Fix blender", "Blender motor burnt out."),
        ("Repair printer", "Printer not feeding paper properly."),
    ], ["appliance", "repair", "electronics", "maintenance"], (400, 1500), (1500, 5000), (5000, 15000)),
    
    ("Roofing", [
        ("Patch roof leak", "Roof leaking during heavy rain. Need to find and patch."),
        ("Replace damaged tiles", "Several roof tiles cracked or missing."),
        ("Gutter installation", "Install rain gutters around house."),
        ("Roof repainting", "Repaint metal roof sheets."),
        ("Complete re-roofing", "Replace entire roof with new materials."),
        ("Install skylight", "Install skylight in bedroom."),
        ("Roof insulation", "Add insulation under roof."),
        ("Fix sagging roof", "Roof section is sagging. Need reinforcement."),
        ("Flashing repair", "Repair damaged roof flashing."),
        ("Roof deck coating", "Apply waterproof coating to roof deck."),
        ("Ridge cap replacement", "Replace damaged ridge caps."),
        ("Solar panel mounting", "Install mounting for solar panels on roof."),
    ], ["roofing", "repair", "installation", "waterproofing"], (800, 3000), (4000, 15000), (30000, 100000)),
    
    ("Landscaping", [
        ("Lawn mowing", "Regular lawn mowing service for front yard."),
        ("Tree trimming", "Trim overgrown trees near power lines."),
        ("Garden design", "Design and plant small garden."),
        ("Install irrigation", "Install drip irrigation system for garden."),
        ("Sod installation", "Install grass sod for 50sqm yard."),
        ("Fence planting", "Plant hedge along fence line."),
        ("Tree removal", "Remove large dead tree from yard."),
        ("Paver installation", "Install pavers for garden pathway."),
        ("Pond construction", "Build small garden pond with pump."),
        ("Retaining wall planting", "Plant terraced garden on retaining wall."),
        ("Outdoor lighting", "Install landscape lighting."),
        ("Weed control", "Clear overgrown weeds from yard."),
    ], ["landscaping", "garden", "outdoor", "plants"], (500, 2000), (3000, 10000), (15000, 50000)),
    
    ("Flooring", [
        ("Tile installation", "Install ceramic tiles in kitchen 10sqm."),
        ("Hardwood refinishing", "Sand and refinish hardwood floors."),
        ("Vinyl flooring", "Install vinyl flooring in bedroom."),
        ("Laminate flooring", "Install laminate flooring in living room."),
        ("Marble polishing", "Polish and restore marble floors."),
        ("Carpet installation", "Install wall-to-wall carpet."),
        ("Concrete polishing", "Polish concrete floors for industrial look."),
        ("Tile repair", "Replace cracked tiles in bathroom."),
        ("Epoxy coating", "Apply epoxy coating to garage floor."),
        ("Outdoor tiles", "Install non-slip tiles on outdoor patio."),
        ("Underlayment install", "Install subfloor underlayment."),
        ("Grout cleaning", "Deep clean and reseal grout lines."),
    ], ["flooring", "tiles", "installation", "refinishing"], (800, 3000), (4000, 15000), (20000, 80000)),
    
    ("Pest Control", [
        ("Ant treatment", "Ant infestation in kitchen. Need treatment."),
        ("Termite treatment", "Termite activity found. Need inspection and treatment."),
        ("Cockroach control", "Cockroach problem throughout house."),
        ("Mosquito fogging", "Outdoor mosquito fogging service."),
        ("Rat control", "Rat infestation in attic and walls."),
        ("Bed bug treatment", "Bed bug infestation in bedroom."),
        ("General pest control", "Quarterly pest prevention service."),
        ("Wood treatment", "Treat wooden structures for termites."),
        ("Snake removal", "Snake found in property. Need removal."),
        ("Bee hive removal", "Remove bee hive from tree."),
        ("Fumigation", "Complete house fumigation."),
        ("Preventive treatment", "Annual preventive pest treatment."),
    ], ["pest control", "extermination", "treatment", "prevention"], (800, 2500), (3000, 8000), (10000, 30000)),
    
    ("Moving", [
        ("Local house move", "Move 2BR apartment within city."),
        ("Office relocation", "Move office furniture and equipment."),
        ("Piano moving", "Move upright piano to new location."),
        ("Furniture delivery", "Deliver purchased furniture from store."),
        ("Storage unit move", "Move contents of storage unit."),
        ("Long distance move", "Move household to different city."),
        ("Appliance moving", "Move heavy appliances to new kitchen."),
        ("Packing service", "Pack all household items for move."),
        ("Loading/unloading", "Load and unload moving truck."),
        ("Disposal service", "Remove and dispose old furniture."),
        ("Crate and ship", "Crate valuable items for shipping."),
        ("Same day moving", "Emergency same day moving service."),
    ], ["moving", "relocation", "delivery", "hauling"], (800, 3000), (4000, 12000), (15000, 50000)),
    
    ("Demolition", [
        ("Wall removal", "Remove non-load bearing wall."),
        ("Tile removal", "Remove old floor tiles."),
        ("Deck demolition", "Remove old wooden deck."),
        ("Shed demolition", "Tear down old storage shed."),
        ("Driveway removal", "Break up and remove concrete driveway."),
        ("Pool demolition", "Fill in and remove above ground pool."),
        ("Partial house demo", "Demolish room for renovation."),
        ("Cabinet removal", "Remove old kitchen cabinets."),
        ("Fence demolition", "Remove old wooden fence."),
        ("Bathroom demo", "Gut bathroom for renovation."),
        ("Fireplace removal", "Remove old fireplace structure."),
        ("Debris hauling", "Haul away demolition debris."),
    ], ["demolition", "removal", "teardown", "hauling"], (1000, 4000), (5000, 15000), (20000, 80000)),
    
    ("Pool Service", [
        ("Pool cleaning", "Regular pool cleaning service."),
        ("Filter cleaning", "Clean pool filter system."),
        ("Chemical balancing", "Test and balance pool chemicals."),
        ("Pump repair", "Pool pump not working properly."),
        ("Tile cleaning", "Clean pool tile line."),
        ("Leak detection", "Find source of pool water loss."),
        ("Pool draining", "Drain and clean empty pool."),
        ("Liner repair", "Patch pool liner tear."),
        ("Equipment installation", "Install new pool equipment."),
        ("Weekly maintenance", "Weekly pool maintenance service."),
        ("Winter closing", "Prepare pool for off season."),
        ("Green pool recovery", "Recover algae-filled green pool."),
    ], ["pool", "maintenance", "cleaning", "repair"], (600, 2000), (2500, 8000), (10000, 40000)),
    
    ("Security Installation", [
        ("CCTV installation", "Install 4-camera CCTV system."),
        ("Alarm system", "Install home security alarm."),
        ("Motion sensor lights", "Install motion activated lights."),
        ("Door lock upgrade", "Install smart door lock."),
        ("Intercom system", "Install door intercom with camera."),
        ("Safe installation", "Install wall safe."),
        ("Security gate", "Install automatic security gate."),
        ("Fence sensors", "Install perimeter sensors."),
        ("Access control", "Install keycard access system."),
        ("Camera upgrade", "Upgrade to HD security cameras."),
        ("Monitoring setup", "Set up remote monitoring."),
        ("Electric fence", "Install electric fence system."),
    ], ["security", "CCTV", "installation", "alarm"], (1500, 5000), (6000, 20000), (25000, 100000)),
]

SKILL_LEVELS = ["ENTRY", "INTERMEDIATE", "EXPERT"]
JOB_SCOPES = ["MINOR_REPAIR", "MODERATE_PROJECT", "MAJOR_RENOVATION"]
WORK_ENVIRONMENTS = ["INDOOR", "OUTDOOR", "BOTH"]


def generate_job(project_id: int, category_data: tuple) -> Dict:
    """Generate a single job entry."""
    category_name, templates, base_tags, minor_range, moderate_range, major_range = category_data
    
    # Select job template
    title, desc_base = random.choice(templates)
    
    # Add variation to description
    variations = [
        f" Already have the materials.",
        f" Need to purchase materials.",
        f" Very urgent - need ASAP.",
        f" Can be scheduled for next week.",
        f" Please message for viewing.",
        f" Price is negotiable.",
        f" Need experienced professional.",
        f" First time homeowner.",
        "",  # No variation
        "",  # No variation
    ]
    description = desc_base + random.choice(variations)
    
    # Determine job scope and pricing
    scope_idx = random.choices([0, 1, 2], weights=[45, 40, 15])[0]  # More minor jobs
    job_scope = JOB_SCOPES[scope_idx]
    
    if scope_idx == 0:
        min_price = random.randint(minor_range[0], minor_range[1])
        max_price = min_price + random.randint(int(min_price * 0.2), int(min_price * 0.8))
    elif scope_idx == 1:
        min_price = random.randint(moderate_range[0], moderate_range[1])
        max_price = min_price + random.randint(int(min_price * 0.3), int(min_price * 1.0))
    else:
        min_price = random.randint(major_range[0], major_range[1])
        max_price = min_price + random.randint(int(min_price * 0.4), int(min_price * 1.2))
    
    avg_price = (min_price + max_price) // 2
    
    # Skill level correlates with job scope
    if scope_idx == 2:  # Major
        skill_weights = [5, 25, 70]  # Mostly expert
    elif scope_idx == 1:  # Moderate
        skill_weights = [20, 55, 25]  # Mostly intermediate
    else:  # Minor
        skill_weights = [50, 40, 10]  # Mostly entry
    
    skill_idx = random.choices([0, 1, 2], weights=skill_weights)[0]
    skill_level = SKILL_LEVELS[skill_idx]
    
    # Work environment
    work_env = random.choice(WORK_ENVIRONMENTS)
    
    # Generate tags
    num_tags = random.randint(2, 4)
    tags = random.sample(base_tags, min(num_tags, len(base_tags)))
    tags_str = str(tags)
    
    # Location
    city = random.choice(PH_CITIES)
    
    # Client rating
    rating = round(random.uniform(3.5, 5.0), 1)
    reviews = random.randint(1, 50)
    
    return {
        "projectId": project_id,
        "job_title": title,
        "job_description": description,
        "tags": tags_str,
        "client_state": city,
        "client_country": "Philippines",
        "client_average_rating": rating,
        "client_review_count": reviews,
        "min_price": min_price,
        "max_price": max_price,
        "avg_price": avg_price,
        "currency": "PHP",
        "rate_type": "fixed",
        "job_scope": job_scope,
        "skill_level": skill_level,
        "work_environment": work_env,
    }


def main():
    """Generate 500 synthetic Philippine blue-collar jobs."""
    output_path = Path(__file__).parent / "Datasets" / "ph_blue_collar_synthetic.csv"
    
    jobs = []
    project_id = 1
    
    # Generate jobs for each category
    for category_data in CATEGORIES:
        # Generate 25-30 jobs per category
        num_jobs = random.randint(25, 30)
        for _ in range(num_jobs):
            job = generate_job(project_id, category_data)
            jobs.append(job)
            project_id += 1
    
    # Shuffle jobs
    random.shuffle(jobs)
    
    # Write CSV
    fieldnames = [
        "projectId", "job_title", "job_description", "tags", "client_state",
        "client_country", "client_average_rating", "client_review_count",
        "min_price", "max_price", "avg_price", "currency", "rate_type",
        "job_scope", "skill_level", "work_environment"
    ]
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(jobs)
    
    print(f"Generated {len(jobs)} synthetic Philippine blue-collar jobs")
    print(f"Output: {output_path}")
    
    # Print category distribution
    print("\nCategory Distribution:")
    category_counts = {}
    for job in jobs:
        # Extract category from title (rough approximation)
        for cat_data in CATEGORIES:
            cat_name = cat_data[0]
            for title, _ in cat_data[1]:
                if job["job_title"] == title:
                    category_counts[cat_name] = category_counts.get(cat_name, 0) + 1
                    break
    
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")


if __name__ == "__main__":
    main()
