"""
Management command to clear all rate limit caches.

Usage:
    python manage.py clear_rate_limits
    python manage.py clear_rate_limits --ip 192.168.1.1
    python manage.py clear_rate_limits --category auth
"""

from django.core.management.base import BaseCommand
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clear rate limit caches (all or specific IP/category)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ip',
            type=str,
            help='Clear rate limits for specific IP address',
        )
        parser.add_argument(
            '--category',
            type=str,
            help='Clear rate limits for specific category (auth, api_write, api_read, upload, payment)',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Clear ALL cache keys (use with caution)',
        )

    def handle(self, *args, **options):
        ip_filter = options.get('ip')
        category_filter = options.get('category')
        clear_all = options.get('all')

        if clear_all:
            self.stdout.write(self.style.WARNING('Clearing ALL cache...'))
            cache.clear()
            self.stdout.write(self.style.SUCCESS('✅ All cache cleared'))
            return

        # Rate limit key prefixes
        prefixes = [
            'rl:auth',
            'rl:pwd',
            'rl:write',
            'rl:read',
            'rl:upload',
            'rl:payment',
        ]

        if category_filter:
            # Map category names to prefixes
            category_map = {
                'auth': 'rl:auth',
                'password_reset': 'rl:pwd',
                'api_write': 'rl:write',
                'api_read': 'rl:read',
                'upload': 'rl:upload',
                'payment': 'rl:payment',
            }
            prefix = category_map.get(category_filter)
            if not prefix:
                self.stdout.write(self.style.ERROR(f'❌ Unknown category: {category_filter}'))
                self.stdout.write(self.style.WARNING(f'Valid categories: {", ".join(category_map.keys())}'))
                return
            prefixes = [prefix]

        if ip_filter:
            import hashlib
            id_hash = hashlib.md5(ip_filter.encode()).hexdigest()[:12]
            self.stdout.write(f'Clearing rate limits for IP: {ip_filter} (hash: {id_hash})')
            keys_deleted = 0
            for prefix in prefixes:
                key = f"{prefix}:{id_hash}"
                if cache.delete(key):
                    keys_deleted += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✅ Deleted {key}'))
            self.stdout.write(self.style.SUCCESS(f'✅ Cleared {keys_deleted} rate limit keys for IP {ip_filter}'))
        else:
            # Clear all rate limit keys (requires Redis client to get all keys)
            self.stdout.write(self.style.WARNING('Clearing all rate limit keys...'))
            try:
                # Try to use Redis client to get all keys with pattern
                from django.core.cache.backends.redis import RedisCache
                if isinstance(cache, RedisCache):
                    keys_deleted = 0
                    for prefix in prefixes:
                        pattern = f"{prefix}:*"
                        # Get Redis client
                        client = cache._cache.get_client(write=True)
                        keys = list(client.scan_iter(match=pattern))
                        for key in keys:
                            cache.delete(key.decode() if isinstance(key, bytes) else key)
                            keys_deleted += 1
                    self.stdout.write(self.style.SUCCESS(f'✅ Cleared {keys_deleted} rate limit keys'))
                else:
                    self.stdout.write(self.style.WARNING('⚠️  Non-Redis cache detected. Use --all to clear entire cache.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
                self.stdout.write(self.style.WARNING('💡 Use --ip to clear specific IP or --all to clear entire cache'))
