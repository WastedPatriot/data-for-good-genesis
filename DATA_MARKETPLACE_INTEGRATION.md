# Data Marketplace Integration Guide

## Current Status: NOT AUTOMATED YET

**Important:** The partnerships with Kaggle, DataHub, and Snowflake mentioned on the site are **aspirational** - they need to be set up manually. Here's how:

## Option 1: Manual Export (Start Here)
1. Admin downloads datasets from your platform
2. Manually upload to:
   - **Kaggle**: Create account → Publish dataset
   - **DataHub**: Sign up → Upload via UI
   - **Snowflake**: Enterprise setup required

## Option 2: API Integration (Future)
Each platform has APIs, but requires:
- **Kaggle API Key**: kaggle.com/account
- **DataHub**: Enterprise license needed
- **Snowflake**: Complex OAuth setup

## Recommendation
Start by manually publishing your first datasets to these platforms to establish presence, then automate later once you have regular customers.

## Your AI Scraper + Marketplace
Your scraper → edge function → auto-publishes to YOUR marketplace ✅
External platforms (Kaggle, etc.) → manual for now ⏳
