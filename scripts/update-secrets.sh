#!/usr/bin/env bash
gh secret set POSTGRES_PASSWORD -b"Pg_Secure_2026DbPwV2"
gh secret set DATABASE_URL -b"postgresql://postgres:Pg_Secure_2026DbPwV2@db:5432/mobi_prod"
gh secret set CLOUDFLARE_DB_TUNNEL_TOKEN -b"eyJhIjoiMzYxNDM4NzgyZDM5MTFkNTI4NmM3ZGY4OGMwYzdiMDUiLCJ0IjoiMzRmMWIyMTYtYjhjNi00ZjBhLTk2MjItODQ4YWM2OTJkYmQ2IiwicyI6Ik5qaGtZell3TjJRdE9EVTJZUzAwTjJRM0xXSXlNRFl0WXpJNU1ESmxZakZtWW1ZNSJ9"
echo "GitHub Secrets updated successfully!"
