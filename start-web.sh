#!/bin/bash
# Quick start script for IAYOS web frontend
echo "🚀 Starting IAYOS Web Frontend..."
cd "$(dirname "$0")/apps/frontend_web"
echo "📁 Working directory: $(pwd)"
npm run dev