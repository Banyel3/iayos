"""
Management command to seed initial data for the iAYOS platform.

Seeds:
- Blue collar work specializations (job categories)
- Zamboanga City and its 98 barangays

Usage:
    python manage.py seed_data
    python manage.py seed_data --specializations-only
    python manage.py seed_data --locations-only
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed initial data: specializations and Zamboanga City barangays'

    def add_arguments(self, parser):
        parser.add_argument(
            '--specializations-only',
            action='store_true',
            help='Only seed specializations',
        )
        parser.add_argument(
            '--locations-only',
            action='store_true',
            help='Only seed city and barangays',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-seed even if data exists',
        )

    def handle(self, *args, **options):
        specializations_only = options.get('specializations_only', False)
        locations_only = options.get('locations_only', False)
        force = options.get('force', False)

        if not specializations_only and not locations_only:
            # Seed both
            self.seed_specializations(force)
            self.seed_locations(force)
        elif specializations_only:
            self.seed_specializations(force)
        elif locations_only:
            self.seed_locations(force)

        self.stdout.write(self.style.SUCCESS('Seeding completed successfully!'))

    def seed_specializations(self, force=False):
        """Seed blue collar work specializations (job categories)"""
        from accounts.models import Specializations

        if not force and Specializations.objects.exists():
            self.stdout.write(self.style.WARNING(
                'Specializations already exist. Use --force to re-seed.'
            ))
            return

        self.stdout.write('Seeding specializations...')

        # Blue collar work specializations with minimum rates (in PHP)
        specializations_data = [
            {
                'name': 'Plumbing',
                'description': 'Installation, repair, and maintenance of water supply, drainage, and sewage systems including pipes, fixtures, and fittings.',
                'minimum_rate': Decimal('500.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('500.00'),
                'avg_cost_max': Decimal('5000.00'),
            },
            {
                'name': 'Electrical Work',
                'description': 'Installation, repair, and maintenance of electrical systems including wiring, outlets, switches, lighting, and circuit breakers.',
                'minimum_rate': Decimal('600.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('500.00'),
                'avg_cost_max': Decimal('8000.00'),
            },
            {
                'name': 'Carpentry',
                'description': 'Construction, installation, and repair of wooden structures and fixtures including cabinets, doors, windows, and furniture.',
                'minimum_rate': Decimal('450.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('1000.00'),
                'avg_cost_max': Decimal('15000.00'),
            },
            {
                'name': 'Painting',
                'description': 'Interior and exterior painting services including surface preparation, primer application, and finishing coats.',
                'minimum_rate': Decimal('350.00'),
                'rate_type': 'hourly',
                'skill_level': 'entry',
                'avg_cost_min': Decimal('2000.00'),
                'avg_cost_max': Decimal('20000.00'),
            },
            {
                'name': 'Masonry',
                'description': 'Construction and repair of structures using brick, stone, concrete blocks, and other masonry materials.',
                'minimum_rate': Decimal('500.00'),
                'rate_type': 'daily',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('5000.00'),
                'avg_cost_max': Decimal('50000.00'),
            },
            {
                'name': 'Welding',
                'description': 'Metal fabrication, joining, and repair using various welding techniques including arc, MIG, and TIG welding.',
                'minimum_rate': Decimal('550.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('1000.00'),
                'avg_cost_max': Decimal('10000.00'),
            },
            {
                'name': 'HVAC (Aircon Services)',
                'description': 'Installation, repair, cleaning, and maintenance of air conditioning units and ventilation systems.',
                'minimum_rate': Decimal('500.00'),
                'rate_type': 'fixed',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('500.00'),
                'avg_cost_max': Decimal('5000.00'),
            },
            {
                'name': 'Roofing',
                'description': 'Installation, repair, and maintenance of roofs including shingles, metal roofing, and waterproofing.',
                'minimum_rate': Decimal('600.00'),
                'rate_type': 'daily',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('5000.00'),
                'avg_cost_max': Decimal('50000.00'),
            },
            {
                'name': 'Tiling',
                'description': 'Installation and repair of floor and wall tiles including ceramic, porcelain, and natural stone tiles.',
                'minimum_rate': Decimal('450.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('3000.00'),
                'avg_cost_max': Decimal('25000.00'),
            },
            {
                'name': 'Appliance Repair',
                'description': 'Repair and maintenance of household appliances including refrigerators, washing machines, and other electronics.',
                'minimum_rate': Decimal('400.00'),
                'rate_type': 'fixed',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('500.00'),
                'avg_cost_max': Decimal('3000.00'),
            },
            {
                'name': 'Landscaping',
                'description': 'Garden design, planting, lawn care, tree trimming, and outdoor space maintenance.',
                'minimum_rate': Decimal('350.00'),
                'rate_type': 'hourly',
                'skill_level': 'entry',
                'avg_cost_min': Decimal('1000.00'),
                'avg_cost_max': Decimal('15000.00'),
            },
            {
                'name': 'General Cleaning',
                'description': 'Deep cleaning, regular house cleaning, post-construction cleaning, and sanitation services.',
                'minimum_rate': Decimal('300.00'),
                'rate_type': 'hourly',
                'skill_level': 'entry',
                'avg_cost_min': Decimal('500.00'),
                'avg_cost_max': Decimal('5000.00'),
            },
            {
                'name': 'Pest Control',
                'description': 'Extermination and prevention of pests including insects, rodents, and termites.',
                'minimum_rate': Decimal('500.00'),
                'rate_type': 'fixed',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('1500.00'),
                'avg_cost_max': Decimal('10000.00'),
            },
            {
                'name': 'Auto Mechanic',
                'description': 'Automotive repair and maintenance including engine work, brake service, and general car repairs.',
                'minimum_rate': Decimal('500.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('500.00'),
                'avg_cost_max': Decimal('20000.00'),
            },
            {
                'name': 'Motorcycle Repair',
                'description': 'Repair and maintenance of motorcycles including engine tune-ups, brake service, and electrical repairs.',
                'minimum_rate': Decimal('350.00'),
                'rate_type': 'fixed',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('300.00'),
                'avg_cost_max': Decimal('5000.00'),
            },
            {
                'name': 'Furniture Assembly',
                'description': 'Assembly and installation of ready-to-assemble furniture and fixtures.',
                'minimum_rate': Decimal('300.00'),
                'rate_type': 'fixed',
                'skill_level': 'entry',
                'avg_cost_min': Decimal('300.00'),
                'avg_cost_max': Decimal('2000.00'),
            },
            {
                'name': 'Moving Services',
                'description': 'Packing, loading, transporting, and unloading of household or office items.',
                'minimum_rate': Decimal('400.00'),
                'rate_type': 'hourly',
                'skill_level': 'entry',
                'avg_cost_min': Decimal('1500.00'),
                'avg_cost_max': Decimal('10000.00'),
            },
            {
                'name': 'Glass Installation',
                'description': 'Installation and repair of windows, mirrors, glass doors, and shower enclosures.',
                'minimum_rate': Decimal('500.00'),
                'rate_type': 'fixed',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('1000.00'),
                'avg_cost_max': Decimal('8000.00'),
            },
            {
                'name': 'Drywall Installation',
                'description': 'Installation and repair of drywall, gypsum boards, and ceiling work.',
                'minimum_rate': Decimal('450.00'),
                'rate_type': 'hourly',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('2000.00'),
                'avg_cost_max': Decimal('15000.00'),
            },
            {
                'name': 'Security System Installation',
                'description': 'Installation and setup of CCTV cameras, alarm systems, and access control systems.',
                'minimum_rate': Decimal('600.00'),
                'rate_type': 'fixed',
                'skill_level': 'intermediate',
                'avg_cost_min': Decimal('3000.00'),
                'avg_cost_max': Decimal('25000.00'),
            },
        ]

        with transaction.atomic():
            if force:
                Specializations.objects.all().delete()
                self.stdout.write('Deleted existing specializations.')

            for spec_data in specializations_data:
                spec, created = Specializations.objects.get_or_create(
                    specializationName=spec_data['name'],
                    defaults={
                        'description': spec_data['description'],
                        'minimumRate': spec_data['minimum_rate'],
                        'rateType': spec_data['rate_type'],
                        'skillLevel': spec_data['skill_level'],
                        'averageProjectCostMin': spec_data['avg_cost_min'],
                        'averageProjectCostMax': spec_data['avg_cost_max'],
                    }
                )
                if created:
                    self.stdout.write(f'  Created: {spec_data["name"]}')
                else:
                    self.stdout.write(f'  Skipped (exists): {spec_data["name"]}')

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {Specializations.objects.count()} specializations'
        ))

    def seed_locations(self, force=False):
        """Seed Zamboanga City and its 98 barangays"""
        from accounts.models import City, Barangay

        self.stdout.write('Seeding locations...')

        # Create Zamboanga City
        with transaction.atomic():
            city, city_created = City.objects.get_or_create(
                name='Zamboanga City',
                defaults={
                    'province': 'Zamboanga del Sur',
                    'region': 'Zamboanga Peninsula (Region IX)',
                    'zipCode': '7000',
                }
            )
            if city_created:
                self.stdout.write(f'  Created city: Zamboanga City')
            else:
                self.stdout.write(f'  City exists: Zamboanga City (ID: {city.cityID})')

            if force:
                Barangay.objects.filter(city=city).delete()
                self.stdout.write('  Deleted existing barangays for Zamboanga City.')

            # All 98 barangays in Zamboanga City (from Wikipedia)
            barangays_data = [
                'Arena Blanco',
                'Ayala',
                'Baliwasan',
                'Baluno',
                'Boalan',
                'Bolong',
                'Buenavista',
                'Bunguiao',
                'Busay (Sacol Island)',
                'Cabaluay',
                'Cabatangan',
                'Cacao',
                'Calabasa',
                'Calarian',
                'Camino Nuevo',
                'Campo Islam',
                'Canelar',
                'Capisan',
                'Cawit',
                'Culianan',
                'Curuan',
                'Dita',
                'Divisoria',
                'Dulian (Upper Bunguiao)',
                'Dulian (Upper Pasonanca)',
                'Guisao',
                'Guiwan',
                'Kasanyangan',
                'La Paz',
                'Labuan',
                'Lamisahan',
                'Landang Gua',
                'Landang Laum',
                'Lanzones',
                'Lapakan',
                'Latuan (Curuan)',
                'Licomo',
                'Limaong',
                'Limpapa',
                'Lubigan',
                'Lumayang',
                'Lumbangan',
                'Lunzuran',
                'Maasin',
                'Malagutay',
                'Mampang',
                'Manalipa',
                'Mangusu',
                'Manicahan',
                'Mariki',
                'Mercedes',
                'Muti',
                'Pamucutan',
                'Pangapuyan',
                'Panubigan',
                'Pasilmanta (Sacol Island)',
                'Pasobolong',
                'Pasonanca',
                'Patalon',
                'Putik',
                'Quiniput',
                'Recodo',
                'Rio Hondo',
                'Salaan',
                'San Jose Cawa-Cawa',
                'San Jose Gusu',
                'San Ramon',
                'San Roque',
                'Sangali',
                'Santa Barbara',
                'Santa Catalina',
                'Santa Maria',
                'Santo Niño',
                'Sibulao (Caruan)',
                'Sinubung',
                'Sinunoc',
                'Tagasilay',
                'Taguiti',
                'Talabaan',
                'Talisayan',
                'Talon-Talon',
                'Taluksangay',
                'Tetuan',
                'Tictapul',
                'Tigbalabag',
                'Tigtabon',
                'Tolosa',
                'Tugbungan',
                'Tulungatung',
                'Tumaga',
                'Tumalutab',
                'Tumitus',
                'Victoria',
                'Vitali',
                'Zambowood',
                'Zone I (Poblacion)',
                'Zone II (Poblacion)',
                'Zone III (Poblacion)',
                'Zone IV (Poblacion)',
            ]

            created_count = 0
            skipped_count = 0

            for barangay_name in barangays_data:
                barangay, created = Barangay.objects.get_or_create(
                    name=barangay_name,
                    city=city,
                    defaults={
                        'zipCode': '7000',
                    }
                )
                if created:
                    created_count += 1
                else:
                    skipped_count += 1

            self.stdout.write(self.style.SUCCESS(
                f'Seeded barangays: {created_count} created, {skipped_count} skipped (already exist)'
            ))
            self.stdout.write(self.style.SUCCESS(
                f'Total barangays in Zamboanga City: {Barangay.objects.filter(city=city).count()}'
            ))
